import { InventoryStockAvailabilityAdapter } from './InventoryStockAvailabilityAdapter';
import type InventoryRepo from '../../../inventory/infrastructure/repositories/inventoryRepo';

describe('InventoryStockAvailabilityAdapter', () => {
  let adapter: InventoryStockAvailabilityAdapter;
  let inventoryRepo: jest.Mocked<Pick<typeof InventoryRepo, 'checkProductAvailability'>>;

  beforeEach(() => {
    inventoryRepo = { checkProductAvailability: jest.fn() };
    adapter = new InventoryStockAvailabilityAdapter(inventoryRepo);
  });

  it('implements StockAvailabilityPort', () => {
    expect(typeof adapter.checkAvailability).toBe('function');
  });

  it('should map inventory result to checkout vocabulary', async () => {
    inventoryRepo.checkProductAvailability.mockResolvedValue({
      available: true,
      totalAvailable: 50,
      locations: [],
    });

    const result = await adapter.checkAvailability({
      productId: 'prod-1',
      quantity: 5,
    });

    expect(result.available).toBe(true);
    expect(result.stockLevel).toBe(50);
  });

  it('should report unavailable when stock is insufficient', async () => {
    inventoryRepo.checkProductAvailability.mockResolvedValue({
      available: false,
      totalAvailable: 2,
      locations: [],
    });

    const result = await adapter.checkAvailability({
      productId: 'prod-1',
      quantity: 10,
    });

    expect(result.available).toBe(false);
    expect(result.stockLevel).toBe(2);
  });

  it('should pass productVariantId to inventory repo', async () => {
    inventoryRepo.checkProductAvailability.mockResolvedValue({
      available: true,
      totalAvailable: 100,
      locations: [],
    });

    await adapter.checkAvailability({
      productId: 'prod-1',
      productVariantId: 'var-1',
      quantity: 1,
    });

    expect(inventoryRepo.checkProductAvailability).toHaveBeenCalledWith('prod-1', 'var-1', 1);
  });
});
