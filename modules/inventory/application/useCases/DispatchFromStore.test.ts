jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

import { DispatchFromStoreUseCase } from './DispatchFromStore';
import { StoreDispatchNotFoundError } from '../../domain/errors/InventoryErrors';

describe('DispatchFromStoreUseCase', () => {
  let useCase: DispatchFromStoreUseCase;
  let mockDispatchRepo: Record<string, jest.Mock>;
  let mockInventoryRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockDispatchRepo = {
      findById: jest.fn().mockResolvedValue({
        dispatchId: 'd1', fromStoreId: 's1', status: 'approved', dispatchNumber: 'DSP-001',
        items: [{ productId: 'p1', variantId: undefined, dispatchedQuantity: 10 }],
        markDispatched: jest.fn(), approve: jest.fn(), toJSON: () => ({ dispatchId: 'd1', status: 'dispatched' }),
      }),
      save: jest.fn().mockImplementation(async (d: unknown) => d),
    };
    mockInventoryRepo = {
      getLocationByStoreId: jest.fn().mockResolvedValue({ locationId: 'loc1' }),
      findByProductAndLocation: jest.fn().mockResolvedValue({ inventoryId: 'i1', productId: 'p1', variantId: undefined, locationId: 'loc1', quantity: 100, fulfillReservation: jest.fn() }),
      save: jest.fn().mockImplementation(async (i: unknown) => i),
      recordMovement: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DispatchFromStoreUseCase(mockDispatchRepo as never, mockInventoryRepo as never);
  });

  it('should dispatch from store (happy path)', async () => {
    const result = await useCase.execute('d1', 'user1');

    expect(result.dispatchId).toBe('d1');
  });

  it('should throw StoreDispatchNotFoundError when dispatch not found', async () => {
    mockDispatchRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'user1')).rejects.toThrow(StoreDispatchNotFoundError);
  });
});
