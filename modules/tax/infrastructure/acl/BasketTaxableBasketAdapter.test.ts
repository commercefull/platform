/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('../../../basket/infrastructure/repositories/BasketRepository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

import basketRepo from '../../../basket/infrastructure/repositories/BasketRepository';
import { BasketTaxableBasketAdapter } from './BasketTaxableBasketAdapter';

describe('BasketTaxableBasketAdapter', () => {
  let adapter: BasketTaxableBasketAdapter;
  let mockBasketRepo: any;

  beforeEach(() => {
    mockBasketRepo = basketRepo;
    jest.mocked(mockBasketRepo.findById).mockClear();
    adapter = new BasketTaxableBasketAdapter();
  });

  it('implements TaxableBasketPort', () => {
    expect(typeof adapter.findById).toBe('function');
  });

  it('should map basket to TaxableBasket vocabulary', async () => {
    mockBasketRepo.findById.mockResolvedValue({
      basketId: 'basket-1',
      items: [
        { productId: 'prod-1', quantity: 2, unitPrice: { amount: 10.5 } },
        { productId: 'prod-2', quantity: 1, unitPrice: { amount: 25 } },
      ],
      subtotal: { amount: 46 },
    });

    const result = await adapter.findById('basket-1');

    expect(result).not.toBeNull();
    expect(result!.basketId).toBe('basket-1');
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].productId).toBe('prod-1');
    expect(result!.items[0].quantity).toBe(2);
    expect(result!.items[0].price).toBe(10.5);
    expect(result!.items[1].price).toBe(25);
    expect(result!.subtotal).toBe(46);
  });

  it('should return null when basket not found', async () => {
    mockBasketRepo.findById.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('should handle empty items array', async () => {
    mockBasketRepo.findById.mockResolvedValue({
      basketId: 'basket-empty',
      items: [],
      subtotal: { amount: 0 },
    });

    const result = await adapter.findById('basket-empty');

    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
    expect(result!.subtotal).toBe(0);
  });

  it('should handle null items gracefully', async () => {
    mockBasketRepo.findById.mockResolvedValue({
      basketId: 'basket-null-items',
      items: null,
      subtotal: { amount: 0 },
    });

    const result = await adapter.findById('basket-null-items');

    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
  });

  it('should propagate errors from basket repo', async () => {
    mockBasketRepo.findById.mockRejectedValue(new Error('DB error'));

    await expect(adapter.findById('basket-1')).rejects.toThrow('DB error');
  });
});
