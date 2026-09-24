import { lazyMock } from '../../tests/testUtils';
import { SetLowStockThresholdUseCase } from './SetLowStockThreshold';
import { InventoryValidationError, InventoryItemNotFoundError } from '../../domain/errors/InventoryErrors';

describe('SetLowStockThresholdUseCase', () => {
  let useCase: SetLowStockThresholdUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof SetLowStockThresholdUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof SetLowStockThresholdUseCase>[0]>();
    mockRepo.findByProduct.mockResolvedValue({ inventoryId: 'i1', quantity: 5, reservedQuantity: 0, lowStockThreshold: 10 });
    mockRepo.updateReorderPoint.mockResolvedValue(undefined);
    useCase = new SetLowStockThresholdUseCase(mockRepo);
  });

  it('should set low stock threshold (happy path)', async () => {
    const result = await useCase.execute({ productId: 'p1', locationId: 'w1', reorderPoint: 15 });

    expect(result.inventoryItemId).toBe('i1');
    expect(result.reorderPoint).toBe(15);
    expect(result.isLowStock).toBe(true);
  });

  it('should throw InventoryValidationError when reorderPoint is negative', async () => {
    await expect(useCase.execute({ productId: 'p1', locationId: 'w1', reorderPoint: -1 })).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryItemNotFoundError when inventory not found', async () => {
    mockRepo.findByProduct.mockResolvedValue(null);

    await expect(useCase.execute({ productId: 'missing', locationId: 'w1', reorderPoint: 10 })).rejects.toThrow(InventoryItemNotFoundError);
  });
});
