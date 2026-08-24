jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ApproveStoreDispatchUseCase } from './ApproveStoreDispatch';
import { StoreDispatchNotFoundError } from '../../domain/errors/InventoryErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ApproveStoreDispatchUseCase', () => {
  let useCase: ApproveStoreDispatchUseCase;
  let mockDispatchRepo: Record<string, jest.Mock>;
  let mockInventoryRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockDispatchRepo = {
      findById: jest.fn().mockResolvedValue({
        dispatchId: 'd1', fromStoreId: 's1', items: [{ productId: 'p1', variantId: undefined, requestedQuantity: 10 }],
        approve: jest.fn(), toJSON: () => ({ dispatchId: 'd1', status: 'approved' }),
      }),
      save: jest.fn().mockImplementation(async (d: unknown) => d),
    };
    mockInventoryRepo = {
      getLocationByStoreId: jest.fn().mockResolvedValue({ locationId: 'loc1' }),
      findByProductAndLocation: jest.fn().mockResolvedValue({ availableQuantity: 100 }),
    };
    useCase = new ApproveStoreDispatchUseCase(mockDispatchRepo as never, mockInventoryRepo as never);
  });

  it('should approve dispatch (happy path)', async () => {
    const result = await useCase.execute('d1', 'admin1');

    expect(result.dispatchId).toBe('d1');
    expect(eventBus.emit).toHaveBeenCalledWith('inventory.dispatch.approved', expect.objectContaining({ dispatchId: 'd1' }));
  });

  it('should throw StoreDispatchNotFoundError when dispatch not found', async () => {
    mockDispatchRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'admin1')).rejects.toThrow(StoreDispatchNotFoundError);
  });
});
