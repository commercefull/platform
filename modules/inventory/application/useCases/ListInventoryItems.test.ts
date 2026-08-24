import { ListInventoryItemsUseCase} from './ListInventoryItems';

describe('ListInventoryItemsUseCase', () => {
  let useCase: ListInventoryItemsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue({
        data: [
          { inventoryId: 'i1', productId: 'p1', locationId: 'w1', sku: 'SKU1', quantity: 100, reservedQuantity: 10, reorderPoint: 20 },
          { inventoryId: 'i2', productId: 'p2', locationId: 'w1', sku: 'SKU2', quantity: 0, reservedQuantity: 0, reorderPoint: 5 },
        ],
        total: 2,
      }),
      getStats: jest.fn().mockResolvedValue({ totalItems: 100, lowStockCount: 5, outOfStockCount: 2, totalValue: 5000 }),
    };
    useCase = new ListInventoryItemsUseCase(mockRepo as never);
  });

  it('should list inventory items (happy path)', async () => {
    const result = await useCase.execute({ warehouseId: 'w1' });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.summary.totalItems).toBe(100);
    expect(result.summary.lowStockCount).toBe(5);
  });

  it('should mark items as out of stock when quantity is 0', async () => {
    const result = await useCase.execute({});

    expect(result.items[1].isOutOfStock).toBe(true);
    expect(result.items[1].availableQuantity).toBe(0);
  });

  it('should pass pagination to repository', async () => {
    await useCase.execute({ page: 2, limit: 10 });

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ limit: 10, offset: 10 }),
    );
  });
});
