/**
 * Unit Tests for RepriceBasket Use Case
 */

import { createBasket, createBasketItem, createBasketRepository, createProductPricePort, BASKET_ID } from '../../tests/testUtils';
import { RepriceBasketUseCase } from './RepriceBasket';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';
import { Money } from '../../domain/valueObjects/Money';

describe('RepriceBasketUseCase', () => {
  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);
    const useCase = new RepriceBasketUseCase(repository, createProductPricePort());

    await expect(useCase.execute('missing')).rejects.toThrow(BasketNotFoundError);
  });

  it('should update item prices when the authoritative price changed', async () => {
    const item = createBasketItem({ unitPrice: Money.fromCents(5000, 'USD') });
    const basket = createBasket({ storeId: 'store-1', channelId: 'ch-1', items: [item] });
    const repository = createBasketRepository(basket);
    const pricePort = createProductPricePort({ unitPriceCents: 4500, currency: 'USD' });
    const useCase = new RepriceBasketUseCase(repository, pricePort);

    const result = await useCase.execute(BASKET_ID);

    expect(result.repriced).toBe(true);
    expect(result.changes).toEqual([
      expect.objectContaining({ productId: 'product-1', previousUnitPriceCents: 5000, unitPriceCents: 4500 }),
    ]);
    expect(result.subtotalCents).toBe(4500);
    expect(repository.updateItem).toHaveBeenCalledWith(item);
    expect(repository.save).toHaveBeenCalledWith(basket);
  });

  it('should resolve prices with the basket store/channel/currency context', async () => {
    const item = createBasketItem({ quantity: 3 });
    const basket = createBasket({ storeId: 'store-1', channelId: 'ch-9', currency: 'EUR', items: [item] });
    const repository = createBasketRepository(basket);
    const pricePort = createProductPricePort({ unitPriceCents: 100, currency: 'EUR' });
    const useCase = new RepriceBasketUseCase(repository, pricePort);

    await useCase.execute(BASKET_ID);

    expect(pricePort.getPrice).toHaveBeenCalledWith('product-1', undefined, 'EUR', 3, {
      storeId: 'store-1',
      channelId: 'ch-9',
    });
  });

  it('should leave prices untouched when nothing changed', async () => {
    const item = createBasketItem({ unitPrice: Money.fromCents(5000, 'USD') });
    const basket = createBasket({ items: [item] });
    const repository = createBasketRepository(basket);
    const useCase = new RepriceBasketUseCase(repository, createProductPricePort({ unitPriceCents: 5000, currency: 'USD' }));

    const result = await useCase.execute(BASKET_ID);

    expect(result.repriced).toBe(false);
    expect(result.changes).toEqual([]);
    expect(repository.updateItem).not.toHaveBeenCalled();
  });

  it('should report unpurchasable products when price resolution fails', async () => {
    const item = createBasketItem();
    const basket = createBasket({ items: [item] });
    const repository = createBasketRepository(basket);
    const useCase = new RepriceBasketUseCase(repository, createProductPricePort(null));

    const result = await useCase.execute(BASKET_ID);

    expect(result.unpurchasableProductIds).toEqual(['product-1']);
    expect(repository.updateItem).not.toHaveBeenCalled();
  });

  it('should refresh a percentage coupon against the repriced subtotal', async () => {
    const item = createBasketItem({ unitPrice: Money.fromCents(5000, 'USD'), quantity: 2 });
    const basket = createBasket({ items: [item] });
    basket.applyCoupon('SAVE10', 'percentage', 10);
    const repository = createBasketRepository(basket);
    const useCase = new RepriceBasketUseCase(repository, createProductPricePort({ unitPriceCents: 4000, currency: 'USD' }));

    const result = await useCase.execute(BASKET_ID);

    // 10% of repriced 8000 subtotal
    expect(result.subtotalCents).toBe(8000);
    expect(result.discountAmountCents).toBe(800);
    expect(result.totalCents).toBe(7200);
  });
});
