import { createInventory, createLocation, createStoreDispatch, lazyMock, emitMock } from '../../tests/testUtils';
import { ApproveStoreDispatchUseCase } from './ApproveStoreDispatch';
import { StoreDispatchNotFoundError } from '../../domain/errors/InventoryErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('ApproveStoreDispatchUseCase', () => {
  let useCase: ApproveStoreDispatchUseCase;
  let mockDispatchRepo: jest.Mocked<ConstructorParameters<typeof ApproveStoreDispatchUseCase>[0]>;
  let mockInventoryRepo: jest.Mocked<ConstructorParameters<typeof ApproveStoreDispatchUseCase>[1]>;

  beforeEach(() => {
    mockDispatchRepo = lazyMock<ConstructorParameters<typeof ApproveStoreDispatchUseCase>[0]>();
    mockDispatchRepo.findById.mockResolvedValue(createStoreDispatch({ status: 'pending_approval' }));
    mockDispatchRepo.save.mockImplementation(async (d) => d);
    mockInventoryRepo = lazyMock<ConstructorParameters<typeof ApproveStoreDispatchUseCase>[1]>();
    mockInventoryRepo.getLocationByStoreId.mockResolvedValue(createLocation({ locationId: 'loc1' }));
    mockInventoryRepo.findByProductAndLocation.mockResolvedValue(createInventory({ quantity: 100 }));
    useCase = new ApproveStoreDispatchUseCase(mockDispatchRepo, mockInventoryRepo);
  });

  it('should approve dispatch (happy path)', async () => {
    const result = await useCase.execute('d1', 'admin1');

    expect(result.dispatchId).toBe('d1');
    expect(emitMock).toHaveBeenCalledWith('inventory.dispatch.approved', expect.objectContaining({ dispatchId: 'd1' }));
  });

  it('should throw StoreDispatchNotFoundError when dispatch not found', async () => {
    mockDispatchRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'admin1')).rejects.toThrow(StoreDispatchNotFoundError);
  });
});
