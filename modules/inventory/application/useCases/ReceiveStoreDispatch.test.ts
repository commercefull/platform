jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('inv-uuid'),
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ReceiveStoreDispatchUseCase} from './ReceiveStoreDispatch';
import { StoreDispatchNotFoundError, InventoryLocationNotFoundError } from '../../domain/errors/InventoryErrors';

describe('ReceiveStoreDispatchUseCase', () => {
  let useCase: ReceiveStoreDispatchUseCase;
  let mockDispatchRepo: Record<string, jest.Mock>;
  let mockInventoryRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockDispatchRepo = {
      findById: jest.fn().mockResolvedValue({
        dispatchId: 'd1', toStoreId: 's2',
        items: [{ productId: 'p1', variantId: undefined, sku: 'SKU1', receivedQuantity: 0 }],
        markReceived: jest.fn(), toJSON: () => ({ dispatchId: 'd1', status: 'received' }),
      }),
      save: jest.fn().mockImplementation(async (d: unknown) => d),
    };
    mockInventoryRepo = {
      getLocationByStoreId: jest.fn().mockResolvedValue({ locationId: 'loc2' }),
      findByProductAndLocation: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (i: unknown) => i),
      recordMovement: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReceiveStoreDispatchUseCase(mockDispatchRepo as never, mockInventoryRepo as never);
  });

  it('should receive dispatch (happy path)', async () => {
    const result = await useCase.execute({
      dispatchId: 'd1', receivedBy: 'user1', items: [{ dispatchItemId: 'di1', receivedQuantity: 10 }],
    });

    expect(result.dispatchId).toBe('d1');
  });

  it('should throw StoreDispatchNotFoundError when dispatch not found', async () => {
    mockDispatchRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ dispatchId: 'missing', receivedBy: 'u1', items: [] })).rejects.toThrow(StoreDispatchNotFoundError);
  });

  it('should throw InventoryLocationNotFoundError when destination not found', async () => {
    mockInventoryRepo.getLocationByStoreId.mockResolvedValue(null);

    await expect(useCase.execute({ dispatchId: 'd1', receivedBy: 'u1', items: [] })).rejects.toThrow(InventoryLocationNotFoundError);
  });
});
