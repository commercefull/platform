jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { TransferBetweenStoresUseCase} from './TransferBetweenStores';
import { InventoryValidationError, InsufficientStockError } from '../../domain/errors/InventoryErrors';

describe('TransferBetweenStoresUseCase', () => {
  let useCase: TransferBetweenStoresUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getAvailableQuantity: jest.fn().mockResolvedValue(100),
      reserveForTransfer: jest.fn().mockResolvedValue(undefined),
      createTransfer: jest.fn().mockResolvedValue({
        transferId: 'xfer1', sourceStoreId: 's1', targetStoreId: 's2', status: 'pending', createdAt: new Date(),
      }),
    };
    useCase = new TransferBetweenStoresUseCase(mockRepo as never);
  });

  it('should transfer between stores (happy path)', async () => {
    const result = await useCase.execute({
      sourceStoreId: 's1', targetStoreId: 's2', items: [{ productId: 'p1', quantity: 10 }],
    });

    expect(result.transferId).toBe('xfer1');
    expect(result.totalQuantity).toBe(10);
    expect(mockRepo.reserveForTransfer).toHaveBeenCalled();
  });

  it('should throw InventoryValidationError when source and target are same', async () => {
    await expect(useCase.execute({
      sourceStoreId: 's1', targetStoreId: 's1', items: [{ productId: 'p1', quantity: 10 }],
    })).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryValidationError when no items', async () => {
    await expect(useCase.execute({
      sourceStoreId: 's1', targetStoreId: 's2', items: [],
    })).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InsufficientStockError when not enough stock', async () => {
    mockRepo.getAvailableQuantity.mockResolvedValue(5);

    await expect(useCase.execute({
      sourceStoreId: 's1', targetStoreId: 's2', items: [{ productId: 'p1', quantity: 10 }],
    })).rejects.toThrow(InsufficientStockError);
  });
});
