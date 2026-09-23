import { lazyMock } from '../../tests/testUtils';
import { GetOutOfStockItemsUseCase } from './GetOutOfStockItems';

describe('GetOutOfStockItemsUseCase', () => {
  let useCase: GetOutOfStockItemsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetOutOfStockItemsUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof GetOutOfStockItemsUseCase>[0]>();
    mockRepo.findOutOfStock.mockResolvedValue([
      { inventoryItemId: 'i1', productId: 'p1', sku: 'SKU1', warehouseId: 'w1', reservedQuantity: 5, reorderQuantity: 50, lastStockedAt: '2024-01-01' },
      { inventoryItemId: 'i2', productId: 'p2', sku: 'SKU2', warehouseId: 'w1', reservedQuantity: 0, reorderQuantity: 20, lastStockedAt: '2024-02-01' },
    ]);
    useCase = new GetOutOfStockItemsUseCase(mockRepo);
  });

  it('should get out of stock items (happy path)', async () => {
    const result = await useCase.execute({ warehouseId: 'w1' });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.hasReservedStock).toBe(1);
  });

  it('should calculate days since last stocked', async () => {
    const result = await useCase.execute({});

    expect(result.items[0].daysSinceLastStock).toBeGreaterThanOrEqual(0);
  });
});
