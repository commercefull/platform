import { GetLowStockItemsUseCase} from './GetLowStockItems';

describe('GetLowStockItemsUseCase', () => {
  let useCase: GetLowStockItemsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findLowStock: jest.fn().mockResolvedValue([
        { inventoryItemId: 'i1', productId: 'p1', sku: 'SKU1', warehouseId: 'w1', quantity: 5, reservedQuantity: 0, reorderPoint: 10, reorderQuantity: 50 },
        { inventoryItemId: 'i2', productId: 'p2', sku: 'SKU2', warehouseId: 'w1', quantity: 2, reservedQuantity: 1, reorderPoint: 5, reorderQuantity: 20 },
      ]),
    };
    useCase = new GetLowStockItemsUseCase(mockRepo as never);
  });

  it('should get low stock items (happy path)', async () => {
    const result = await useCase.execute({ warehouseId: 'w1' });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.criticalCount).toBe(0);
  });

  it('should calculate suggested reorder quantity', async () => {
    const result = await useCase.execute({});

    expect(result.items[0].suggestedReorder).toBeGreaterThan(0);
  });
});
