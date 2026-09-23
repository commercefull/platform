import { InventoryStockAvailabilityAdapter } from './InventoryStockAvailabilityAdapter';
import type InventoryRepoType from '../../../inventory/infrastructure/repositories/inventoryRepo';
import type { InventoryLocation } from '../../../inventory/infrastructure/repositories/inventoryRepo';

describe('InventoryStockAvailabilityAdapter', () => {
  let adapter: InventoryStockAvailabilityAdapter;
  let InventoryRepo: jest.Mocked<Pick<typeof InventoryRepoType, 'checkProductAvailability' | 'getTotalStockForProduct'>>;

  beforeEach(() => {
    InventoryRepo = { checkProductAvailability: jest.fn(), getTotalStockForProduct: jest.fn() };
    adapter = new InventoryStockAvailabilityAdapter(InventoryRepo);
  });

  it('implements StockAvailabilityPort', () => {
    expect(typeof adapter.checkAvailability).toBe('function');
    expect(typeof adapter.getTotalStock).toBe('function');
  });

  it('should map inventory result to product vocabulary', async () => {
    InventoryRepo.checkProductAvailability.mockResolvedValue({
      available: true,
      totalAvailable: 50,
      locations: [
        { inventoryLocationId: 'loc-1' } as unknown as InventoryLocation,
        { inventoryLocationId: 'loc-2' } as unknown as InventoryLocation,
      ],
    });

    const result = await adapter.checkAvailability({
      productId: 'prod-1',
      quantity: 5,
    });

    expect(result.available).toBe(true);
    expect(result.totalAvailable).toBe(50);
    expect(result.locationCount).toBe(2);
  });

  it('should report unavailable when stock is insufficient', async () => {
    InventoryRepo.checkProductAvailability.mockResolvedValue({
      available: false,
      totalAvailable: 2,
      locations: [],
    });

    const result = await adapter.checkAvailability({
      productId: 'prod-1',
      quantity: 10,
    });

    expect(result.available).toBe(false);
    expect(result.totalAvailable).toBe(2);
    expect(result.locationCount).toBe(0);
  });

  it('should pass productVariantId to inventory repo', async () => {
    InventoryRepo.checkProductAvailability.mockResolvedValue({
      available: true,
      totalAvailable: 100,
      locations: [],
    });

    await adapter.checkAvailability({
      productId: 'prod-1',
      productVariantId: 'var-1',
      quantity: 1,
    });

    expect(InventoryRepo.checkProductAvailability).toHaveBeenCalledWith('prod-1', 'var-1', 1);
  });

  it('should get total stock for a product', async () => {
    InventoryRepo.getTotalStockForProduct.mockResolvedValue(250);

    const result = await adapter.getTotalStock('prod-1');

    expect(result).toBe(250);
    expect(InventoryRepo.getTotalStockForProduct).toHaveBeenCalledWith('prod-1');
  });

  it('should return 0 when getTotalStockForProduct throws', async () => {
    InventoryRepo.getTotalStockForProduct.mockRejectedValue(new Error('DB error'));

    await expect(adapter.getTotalStock('prod-1')).rejects.toThrow('DB error');
  });
});
