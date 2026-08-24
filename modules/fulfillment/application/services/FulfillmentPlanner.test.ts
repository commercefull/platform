jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../order', () => ({
  OrderRouter: jest.fn().mockImplementation(() => ({
    determineFulfillmentStore: jest.fn().mockResolvedValue({ storeId: 's1' }),
  })),
}));

import { FulfillmentPlanner } from './FulfillmentPlanner';
import { OrderRouter } from '../../../order';

const MockedOrderRouter = OrderRouter as unknown as jest.Mock;

const stores = [
  {
    storeId: 's1', name: 'Store 1',
    address: { line1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
    settings: { allowOnlineOrdering: true },
    priority: 1,
  },
];

describe('FulfillmentPlanner', () => {
  let planner: FulfillmentPlanner;
  let mockRouter: OrderRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = new MockedOrderRouter() as OrderRouter;
    planner = new FulfillmentPlanner(mockRouter, stores, null);
  });

  it('should return empty groups for no items', async () => {
    const result = await planner.plan([]);
    expect(result.groups).toHaveLength(0);
    expect(result.isSplit).toBe(false);
  });

  it('should plan fulfillment from a single store (happy path)', async () => {
    const result = await planner.plan([
      { orderItemId: 'i1', productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 2 },
    ]);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].sourceType).toBe('store');
    expect(result.groups[0].sourceId).toBe('s1');
    expect(result.isSplit).toBe(false);
  });

  it('should fallback to warehouse when no store found', async () => {
    const fallbackWh = {
      distributionWarehouseId: 'w1', name: 'Main WH',
      addressLine1: '456 St', city: 'LA', state: 'CA', postalCode: '90001', country: 'US',
    };
    planner = new FulfillmentPlanner(mockRouter, [], fallbackWh);

    (mockRouter as unknown as { determineFulfillmentStore: jest.Mock })
      .determineFulfillmentStore.mockRejectedValueOnce(new Error('no store'));

    const result = await planner.plan([
      { orderItemId: 'i1', productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 1 },
    ]);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].sourceType).toBe('warehouse');
    expect(result.groups[0].sourceId).toBe('w1');
  });
});
