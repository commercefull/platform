import { createBasket, createBasketItem, createBasketRepository, emitMock, BASKET_ID } from '../../tests/testUtils';
import { RemoveCouponCommand, RemoveCouponUseCase } from './RemoveCoupon';
import { BasketNotFoundError, NoCouponAppliedError } from '../../domain/errors/BasketErrors';

describe('RemoveCouponUseCase', () => {
  it('should remove the coupon when one is applied', async () => {
    const basket = createBasket({ items: [createBasketItem()] });
    basket.applyCoupon('SAVE10', 'percentage', 10);
    const repository = createBasketRepository(basket);

    const result = await new RemoveCouponUseCase(repository).execute(new RemoveCouponCommand(BASKET_ID));

    expect(result.coupon).toBeUndefined();
    expect(result.discountAmount).toBe(0);
    expect(repository.save).toHaveBeenCalledWith(basket);
  });

  it('should emit promotion.coupon_removed when the coupon is removed', async () => {
    const basket = createBasket({ items: [createBasketItem()] });
    basket.applyCoupon('SAVE10', 'percentage', 10);
    const repository = createBasketRepository(basket);

    await new RemoveCouponUseCase(repository).execute(new RemoveCouponCommand(BASKET_ID));

    expect(emitMock).toHaveBeenCalledWith(
      'promotion.coupon_removed',
      expect.objectContaining({ basketId: BASKET_ID, couponCode: 'SAVE10' }),
    );
  });

  it('should throw NoCouponAppliedError when the basket has no coupon', async () => {
    const repository = createBasketRepository(createBasket());

    await expect(new RemoveCouponUseCase(repository).execute(new RemoveCouponCommand(BASKET_ID))).rejects.toThrow(
      NoCouponAppliedError,
    );
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(new RemoveCouponUseCase(repository).execute(new RemoveCouponCommand('missing'))).rejects.toThrow(
      BasketNotFoundError,
    );
  });
});
