jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('dispatch-uuid'),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateStoreDispatchUseCase} from './CreateStoreDispatch';
import { InventoryLocationNotFoundError, InsufficientStockError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('CreateStoreDispatchUseCase', () => {
  let useCase: CreateStoreDispatchUseCase;
  let mockDispatchRepo: Record<string, jest.Mock>;
  let mockInventoryRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockDispatchRepo = {
      save: jest.fn().mockImplementation(async (d: unknown) => d),
    };
    mockInventoryRepo = {
      getLocationByStoreId: jest.fn().mockResolvedValue({ locationId: 'loc1', storeId: 's1' }),
      findByProductAndLocation: jest.fn().mockResolvedValue({ availableQuantity: 100 }),
    };
    useCase = new CreateStoreDispatchUseCase(mockDispatchRepo as never, mockInventoryRepo as never);
  });

  it('should create store dispatch (happy path)', async () => {
    const result = await useCase.execute({
      fromStoreId: 's1', toStoreId: 's2', items: [{ productId: 'p1', quantity: 10 }], requestedBy: 'user1',
    });

    expect(result).toBeDefined();
    expect(mockDispatchRepo.save).toHaveBeenCalled();
  });

  it('should throw InventoryValidationError when source and target are same', async () => {
    await expect(useCase.execute({
      fromStoreId: 's1', toStoreId: 's1', items: [{ productId: 'p1', quantity: 10 }], requestedBy: 'user1',
    })).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryValidationError when no items', async () => {
    await expect(useCase.execute({
      fromStoreId: 's1', toStoreId: 's2', items: [], requestedBy: 'user1',
    })).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryLocationNotFoundError when source location not found', async () => {
    mockInventoryRepo.getLocationByStoreId.mockResolvedValueOnce(null).mockResolvedValueOnce({ locationId: 'loc2' });

    await expect(useCase.execute({
      fromStoreId: 's1', toStoreId: 's2', items: [{ productId: 'p1', quantity: 10 }], requestedBy: 'user1',
    })).rejects.toThrow(InventoryLocationNotFoundError);
  });

  it('should throw InsufficientStockError when not enough stock', async () => {
    mockInventoryRepo.findByProductAndLocation.mockResolvedValue({ availableQuantity: 5 });

    await expect(useCase.execute({
      fromStoreId: 's1', toStoreId: 's2', items: [{ productId: 'p1', quantity: 10 }], requestedBy: 'user1',
    })).rejects.toThrow(InsufficientStockError);
  });
});
