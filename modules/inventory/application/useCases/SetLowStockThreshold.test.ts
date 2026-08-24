jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { SetLowStockThresholdUseCase} from './SetLowStockThreshold';
import { InventoryValidationError, InventoryItemNotFoundError } from '../../domain/errors/InventoryErrors';

describe('SetLowStockThresholdUseCase', () => {
  let useCase: SetLowStockThresholdUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByProduct: jest.fn().mockResolvedValue({ inventoryId: 'i1', quantity: 5, reservedQuantity: 0, lowStockThreshold: 10 }),
      updateReorderPoint: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SetLowStockThresholdUseCase(mockRepo as never);
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
