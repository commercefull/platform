import { createInventory, createLocation, lazyMock, createStoreDispatch } from '../../tests/testUtils';
import { DispatchFromStoreUseCase } from './DispatchFromStore';
import { StoreDispatchNotFoundError } from '../../domain/errors/InventoryErrors';

describe('DispatchFromStoreUseCase', () => {
  let useCase: DispatchFromStoreUseCase;
  let mockDispatchRepo: jest.Mocked<ConstructorParameters<typeof DispatchFromStoreUseCase>[0]>;
  let mockInventoryRepo: jest.Mocked<ConstructorParameters<typeof DispatchFromStoreUseCase>[1]>;

  beforeEach(() => {
    mockDispatchRepo = lazyMock<ConstructorParameters<typeof DispatchFromStoreUseCase>[0]>();
    mockDispatchRepo.findById.mockResolvedValue(createStoreDispatch({ status: 'approved' }));
    mockDispatchRepo.save.mockImplementation(async (d) => d);
    mockInventoryRepo = lazyMock<ConstructorParameters<typeof DispatchFromStoreUseCase>[1]>();
    mockInventoryRepo.getLocationByStoreId.mockResolvedValue(createLocation({ locationId: 'loc1' }));
    mockInventoryRepo.findByProductAndLocation.mockResolvedValue(createInventory({ quantity: 100 }));
    mockInventoryRepo.save.mockImplementation(async (i) => i);
    useCase = new DispatchFromStoreUseCase(mockDispatchRepo, mockInventoryRepo);
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
