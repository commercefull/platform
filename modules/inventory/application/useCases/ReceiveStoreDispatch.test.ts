import { createInventoryMovement, createLocation, lazyMock, createStoreDispatch } from '../../tests/testUtils';
import { ReceiveStoreDispatchUseCase } from './ReceiveStoreDispatch';
import { StoreDispatchNotFoundError, InventoryLocationNotFoundError } from '../../domain/errors/InventoryErrors';

describe('ReceiveStoreDispatchUseCase', () => {
  let useCase: ReceiveStoreDispatchUseCase;
  let mockDispatchRepo: jest.Mocked<ConstructorParameters<typeof ReceiveStoreDispatchUseCase>[0]>;
  let mockInventoryRepo: jest.Mocked<ConstructorParameters<typeof ReceiveStoreDispatchUseCase>[1]>;

  beforeEach(() => {
    mockDispatchRepo = lazyMock<ConstructorParameters<typeof ReceiveStoreDispatchUseCase>[0]>();
    mockDispatchRepo.findById.mockResolvedValue(createStoreDispatch({ status: 'in_transit' }));
    mockDispatchRepo.save.mockImplementation(async (d) => d);
    mockInventoryRepo = lazyMock<ConstructorParameters<typeof ReceiveStoreDispatchUseCase>[1]>();
    mockInventoryRepo.getLocationByStoreId.mockResolvedValue(createLocation({ locationId: 'loc2' }));
    mockInventoryRepo.findByProductAndLocation.mockResolvedValue(null);
    mockInventoryRepo.save.mockImplementation(async (i) => i);
    mockInventoryRepo.recordMovement.mockResolvedValue(createInventoryMovement());
    useCase = new ReceiveStoreDispatchUseCase(mockDispatchRepo, mockInventoryRepo);
  });

  it('should receive dispatch (happy path)', async () => {
    const result = await useCase.execute({
      dispatchId: 'd1',
      receivedBy: 'user1',
      items: [{ dispatchItemId: 'di1', receivedQuantity: 10 }],
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
