/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('../../../inventory/infrastructure/repositories/inventoryRepo', () => ({
  __esModule: true,
  default: {
    checkProductAvailability: jest.fn(),
  },
}));

import { InventoryStockAvailabilityAdapter } from './InventoryStockAvailabilityAdapter';

describe('InventoryStockAvailabilityAdapter', () => {
  let adapter: InventoryStockAvailabilityAdapter;
   
  let InventoryRepo: any;

  beforeEach(() => {
    InventoryRepo = require('../../../inventory/infrastructure/repositories/inventoryRepo').default;
    adapter = new InventoryStockAvailabilityAdapter();
  });

  it('implements StockAvailabilityPort', () => {
    expect(typeof adapter.checkAvailability).toBe('function');
  });

  it('should map inventory result to checkout vocabulary', async () => {
    InventoryRepo.checkProductAvailability.mockResolvedValue({
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
    expect(result.stockLevel).toBe(2);
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
});
