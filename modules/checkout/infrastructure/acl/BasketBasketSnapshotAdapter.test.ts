/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('../../../basket/domain/entities/Basket');
jest.mock('../../../basket/domain/entities/BasketItem');

import { Money } from '../../../../libs/money';

describe('BasketBasketSnapshotAdapter', () => {
  let adapter: import('./BasketBasketSnapshotAdapter').BasketBasketSnapshotAdapter;
  let mockBasketRepo: { findById: jest.Mock; getItems: jest.Mock };

  beforeEach(() => {
    mockBasketRepo = {
      findById: jest.fn(),
      getItems: jest.fn(),
    };
    const { BasketBasketSnapshotAdapter } = require('./BasketBasketSnapshotAdapter');
    adapter = new BasketBasketSnapshotAdapter(mockBasketRepo as never);
  });

  it('implements BasketSnapshotPort', () => {
    expect(typeof adapter.getSnapshot).toBe('function');
  });

  it('should return null when basket is not found', async () => {
    mockBasketRepo.findById.mockResolvedValue(null);
    const result = await adapter.getSnapshot('nonexistent');
    expect(result).toBeNull();
  });

  it('should map basket and items to a snapshot', async () => {
    const mockBasket = {
      basketId: 'basket-1',
      currency: 'USD',
      isEmpty: false,
      itemCount: 2,
      uniqueItemCount: 2,
      subtotal: Money.create(100, 'USD'),
      discountAmount: 0,
      total: Money.create(100, 'USD'),
      coupon: { couponCode: 'SAVE10' },
    };
    const mockItems = [
      {
        productId: 'prod-1',
        productVariantId: 'var-1',
        sku: 'SKU-1',
        name: 'Product 1',
        quantity: 2,
        unitPrice: Money.create(50, 'USD'),
        discountAmount: 0,
        itemType: 'physical',
        isDigital: false,
        imageUrl: 'https://example.com/img.jpg',
      },
    ];
    mockBasketRepo.findById.mockResolvedValue(mockBasket);
    mockBasketRepo.getItems.mockResolvedValue(mockItems);

    const result = await adapter.getSnapshot('basket-1');

    expect(result).not.toBeNull();
    expect(result!.basketId).toBe('basket-1');
    expect(result!.currency).toBe('USD');
    expect(result!.isEmpty).toBe(false);
    expect(result!.itemCount).toBe(2);
    expect(result!.couponCode).toBe('SAVE10');
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].productId).toBe('prod-1');
    expect(result!.items[0].sku).toBe('SKU-1');
    expect(result!.items[0].isDigital).toBe(false);
    expect(result!.items[0].itemType).toBe('physical');
  });

  it('should propagate errors from basket repository', async () => {
    mockBasketRepo.findById.mockRejectedValue(new Error('DB error'));
    await expect(adapter.getSnapshot('basket-1')).rejects.toThrow('DB error');
  });
});
