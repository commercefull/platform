import { BasketTaxableBasketAdapter } from './BasketTaxableBasketAdapter';
import type basketRepo from '../../../basket/infrastructure/repositories/BasketRepository';

type Basket = NonNullable<Awaited<ReturnType<typeof basketRepo.findById>>>;

describe('BasketTaxableBasketAdapter', () => {
  let adapter: BasketTaxableBasketAdapter;
  let mockBasketRepo: jest.Mocked<Pick<typeof basketRepo, 'findById'>>;

  beforeEach(() => {
    mockBasketRepo = { findById: jest.fn() };
    adapter = new BasketTaxableBasketAdapter(mockBasketRepo);
  });

  it('implements TaxableBasketPort', () => {
    expect(typeof adapter.findById).toBe('function');
  });

  it('should map basket to TaxableBasket vocabulary', async () => {
    mockBasketRepo.findById.mockResolvedValue({
      basketId: 'basket-1',
      items: [
        { productId: 'prod-1', quantity: 2, unitPrice: { cents: 1050 } },
        { productId: 'prod-2', quantity: 1, unitPrice: { cents: 2500 } },
      ],
      subtotal: { cents: 4600 },
    } as unknown as Basket);

    const result = await adapter.findById('basket-1');

    expect(result).not.toBeNull();
    expect(result!.basketId).toBe('basket-1');
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].productId).toBe('prod-1');
    expect(result!.items[0].quantity).toBe(2);
    expect(result!.items[0].priceCents).toBe(1050);
    expect(result!.items[1].priceCents).toBe(2500);
    expect(result!.subtotalCents).toBe(4600);
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
      subtotal: { cents: 0 },
    } as unknown as Basket);

    const result = await adapter.findById('basket-empty');

    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
    expect(result!.subtotalCents).toBe(0);
  });

  it('should handle null items gracefully', async () => {
    mockBasketRepo.findById.mockResolvedValue({
      basketId: 'basket-null-items',
      items: null,
      subtotal: { cents: 0 },
    } as unknown as Basket);

    const result = await adapter.findById('basket-null-items');

    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
  });

  it('should propagate errors from basket repo', async () => {
    mockBasketRepo.findById.mockRejectedValue(new Error('DB error'));

    await expect(adapter.findById('basket-1')).rejects.toThrow('DB error');
  });
});
