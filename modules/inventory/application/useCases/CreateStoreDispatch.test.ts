import { createInventory, createLocation, lazyMock } from '../../tests/testUtils';
import { CreateStoreDispatchUseCase } from './CreateStoreDispatch';
import { InventoryLocationNotFoundError, InsufficientStockError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('CreateStoreDispatchUseCase', () => {
  let useCase: CreateStoreDispatchUseCase;
  let mockDispatchRepo: jest.Mocked<ConstructorParameters<typeof CreateStoreDispatchUseCase>[0]>;
  let mockInventoryRepo: jest.Mocked<ConstructorParameters<typeof CreateStoreDispatchUseCase>[1]>;

  beforeEach(() => {
    mockDispatchRepo = lazyMock<ConstructorParameters<typeof CreateStoreDispatchUseCase>[0]>();
    mockDispatchRepo.save.mockImplementation(async (d) => d);
    mockInventoryRepo = lazyMock<ConstructorParameters<typeof CreateStoreDispatchUseCase>[1]>();
    mockInventoryRepo.getLocationByStoreId.mockResolvedValue(createLocation({ locationId: 'loc1', storeId: 's1' }));
    mockInventoryRepo.findByProductAndLocation.mockResolvedValue(createInventory({ quantity: 100 }));
    useCase = new CreateStoreDispatchUseCase(mockDispatchRepo, mockInventoryRepo);
  });

  it('should create store dispatch (happy path)', async () => {
    const result = await useCase.execute({
      fromStoreId: 's1',
      toStoreId: 's2',
      items: [{ productId: 'p1', quantity: 10 }],
      requestedBy: 'user1',
    });

    expect(result).toBeDefined();
    expect(mockDispatchRepo.save).toHaveBeenCalled();
  });

  it('should throw InventoryValidationError when source and target are same', async () => {
    await expect(
      useCase.execute({
        fromStoreId: 's1',
        toStoreId: 's1',
        items: [{ productId: 'p1', quantity: 10 }],
        requestedBy: 'user1',
      }),
    ).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryValidationError when no items', async () => {
    await expect(
      useCase.execute({
        fromStoreId: 's1',
        toStoreId: 's2',
        items: [],
        requestedBy: 'user1',
      }),
    ).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryLocationNotFoundError when source location not found', async () => {
    mockInventoryRepo.getLocationByStoreId.mockResolvedValueOnce(null).mockResolvedValueOnce(createLocation({ locationId: 'loc2' }));

    await expect(
      useCase.execute({
        fromStoreId: 's1',
        toStoreId: 's2',
        items: [{ productId: 'p1', quantity: 10 }],
        requestedBy: 'user1',
      }),
    ).rejects.toThrow(InventoryLocationNotFoundError);
  });

  it('should throw InsufficientStockError when not enough stock', async () => {
    mockInventoryRepo.findByProductAndLocation.mockResolvedValue(createInventory({ quantity: 5 }));

    await expect(
      useCase.execute({
        fromStoreId: 's1',
        toStoreId: 's2',
        items: [{ productId: 'p1', quantity: 10 }],
        requestedBy: 'user1',
      }),
    ).rejects.toThrow(InsufficientStockError);
  });
});
