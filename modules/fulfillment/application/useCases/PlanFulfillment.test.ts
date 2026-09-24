jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { PlanFulfillmentUseCase, FulfillmentGroupItem } from './PlanFulfillment';
import { FulfillmentSourcePort, FulfillableStore } from '../../domain/repositories/FulfillmentSourceRepository';

const stores: FulfillableStore[] = [
  {
    storeId: 's1',
    name: 'Store 1',
    address: { line1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
    settings: { allowOnlineOrdering: true },
    priority: 1,
  },
  {
    storeId: 's2',
    name: 'Store 2',
    address: { line1: '456 Oak', city: 'Boston', state: 'MA', postalCode: '02101', country: 'US' },
    settings: { allowOnlineOrdering: true },
    priority: 2,
  },
];

const item = (orderItemId: string, productId = 'p1'): FulfillmentGroupItem => ({
  orderItemId,
  productId,
  sku: 'SKU1',
  name: 'Widget',
  quantity: 1,
});

const makeSources = (overrides: Partial<FulfillmentSourcePort> = {}): FulfillmentSourcePort => ({
  findFulfillableStores: jest.fn().mockResolvedValue(stores),
  findDefaultWarehouse: jest.fn().mockResolvedValue(null),
  ...overrides,
});

const makeRouter = (impl?: jest.Mock) => ({
  determineFulfillmentStore: impl ?? jest.fn().mockResolvedValue({ storeId: 's1', storeName: 'Store 1', reason: 'test' }),
});

describe('PlanFulfillmentUseCase', () => {
  it('should return empty groups for no items', async () => {
    const useCase = new PlanFulfillmentUseCase(makeRouter(), makeSources());
    const result = await useCase.execute([]);
    expect(result.groups).toHaveLength(0);
    expect(result.isSplit).toBe(false);
  });

  it('should plan fulfillment from a single store (happy path)', async () => {
    const useCase = new PlanFulfillmentUseCase(makeRouter(), makeSources());
    const result = await useCase.execute([item('i1')]);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].sourceType).toBe('store');
    expect(result.groups[0].sourceId).toBe('s1');
    expect(result.groups[0].shipFromAddress).toMatchObject({ addressLine1: '123 Main', city: 'NYC' });
    expect(result.isSplit).toBe(false);
  });

  it('should fall back to warehouse when no store found', async () => {
    const fallbackWh = {
      distributionWarehouseId: 'w1',
      name: 'Main WH',
      addressLine1: '456 St',
      city: 'LA',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
    };
    const router = makeRouter(jest.fn().mockRejectedValue(new Error('no store')));
    const useCase = new PlanFulfillmentUseCase(router, makeSources({ findDefaultWarehouse: jest.fn().mockResolvedValue(fallbackWh) }));

    const result = await useCase.execute([item('i1')]);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].sourceType).toBe('warehouse');
    expect(result.groups[0].sourceId).toBe('w1');
  });

  it('should split items across stores when single-store routing fails', async () => {
    const routerImpl = jest
      .fn()
      // First call (all items) fails
      .mockRejectedValueOnce(new Error('no single store'))
      // Item i1 → s1, item i2 → s2
      .mockResolvedValueOnce({ storeId: 's1', storeName: 'Store 1', reason: 'test' })
      .mockResolvedValueOnce({ storeId: 's2', storeName: 'Store 2', reason: 'test' });

    const useCase = new PlanFulfillmentUseCase(makeRouter(routerImpl), makeSources());
    const result = await useCase.execute([item('i1'), item('i2', 'p2')]);

    expect(result.groups).toHaveLength(2);
    expect(result.isSplit).toBe(true);
    expect(result.groups.map(g => g.sourceId).sort()).toEqual(['s1', 's2']);
    expect(result.groups.every(g => g.items.length === 1)).toBe(true);
  });

  it('should group items routed to the same store into one group', async () => {
    const routerImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error('no single store'))
      .mockResolvedValue({ storeId: 's1', storeName: 'Store 1', reason: 'test' });

    const useCase = new PlanFulfillmentUseCase(makeRouter(routerImpl), makeSources());
    const result = await useCase.execute([item('i1'), item('i2', 'p2')]);

    expect(result.groups).toHaveLength(1);
    expect(result.isSplit).toBe(false);
    expect(result.groups[0].items).toHaveLength(2);
  });

  it('should send unroutable items to the warehouse and mark split when others go to a store', async () => {
    const fallbackWh = { distributionWarehouseId: 'w1', name: 'Main WH' };
    const routerImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error('no single store'))
      // i1 routes to s1, i2 fails entirely
      .mockResolvedValueOnce({ storeId: 's1', storeName: 'Store 1', reason: 'test' })
      .mockRejectedValueOnce(new Error('no store'));

    const useCase = new PlanFulfillmentUseCase(
      makeRouter(routerImpl),
      makeSources({ findDefaultWarehouse: jest.fn().mockResolvedValue(fallbackWh) }),
    );
    const result = await useCase.execute([item('i1'), item('i2', 'p2')]);

    expect(result.groups).toHaveLength(2);
    expect(result.isSplit).toBe(true);
    const warehouse = result.groups.find(g => g.sourceType === 'warehouse');
    expect(warehouse?.items.map(i => i.orderItemId)).toEqual(['i2']);
  });

  it('should warn and drop unroutable items when no fallback warehouse exists', async () => {
    const { logger } = jest.requireMock('../../../../libs/logger') as { logger: { warn: jest.Mock } };
    const routerImpl = jest.fn().mockRejectedValue(new Error('no store'));
    const useCase = new PlanFulfillmentUseCase(makeRouter(routerImpl), makeSources());

    const result = await useCase.execute([item('i1')]);

    expect(result.groups).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('1 items could not be assigned'));
  });
});
