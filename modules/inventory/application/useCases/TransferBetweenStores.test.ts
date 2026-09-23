import { lazyMock } from '../../tests/testUtils';
import { TransferBetweenStoresUseCase } from './TransferBetweenStores';
import { InventoryValidationError, InsufficientStockError } from '../../domain/errors/InventoryErrors';

describe('TransferBetweenStoresUseCase', () => {
  let useCase: TransferBetweenStoresUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof TransferBetweenStoresUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof TransferBetweenStoresUseCase>[0]>();
    mockRepo.getAvailableQuantity.mockResolvedValue(100);
    mockRepo.createTransfer.mockResolvedValue({
      transferId: 'xfer1',
      sourceStoreId: 's1',
      targetStoreId: 's2',
      status: 'pending',
      createdAt: new Date(),
    });
    useCase = new TransferBetweenStoresUseCase(mockRepo);
  });

  it('should transfer between stores (happy path)', async () => {
    const result = await useCase.execute({
      sourceStoreId: 's1',
      targetStoreId: 's2',
      items: [{ productId: 'p1', quantity: 10 }],
    });

    expect(result.transferId).toBe('xfer1');
    expect(result.totalQuantity).toBe(10);
    expect(mockRepo.reserveForTransfer).toHaveBeenCalled();
  });

  it('should throw InventoryValidationError when source and target are same', async () => {
    await expect(
      useCase.execute({
        sourceStoreId: 's1',
        targetStoreId: 's1',
        items: [{ productId: 'p1', quantity: 10 }],
      }),
    ).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryValidationError when no items', async () => {
    await expect(
      useCase.execute({
        sourceStoreId: 's1',
        targetStoreId: 's2',
        items: [],
      }),
    ).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InsufficientStockError when not enough stock', async () => {
    mockRepo.getAvailableQuantity.mockResolvedValue(5);

    await expect(
      useCase.execute({
        sourceStoreId: 's1',
        targetStoreId: 's2',
        items: [{ productId: 'p1', quantity: 10 }],
      }),
    ).rejects.toThrow(InsufficientStockError);
  });
});
