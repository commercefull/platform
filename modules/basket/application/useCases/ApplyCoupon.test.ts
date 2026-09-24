import {
  createBasket,
  createBasketItem,
  createBasketRepository,
  createDiscountQuotePort,
  emitMock,
  BASKET_ID,
} from '../../tests/testUtils';
import { ApplyCouponCommand, ApplyCouponUseCase } from './ApplyCoupon';
import { BasketNotFoundError, BasketValidationError, CouponAlreadyAppliedError } from '../../domain/errors/BasketErrors';

describe('ApplyCouponUseCase', () => {
  it('should apply the coupon to the basket when the discount is valid', async () => {
    const basket = createBasket({ customerId: 'customer-1', items: [createBasketItem({ quantity: 2 })] });
    const repository = createBasketRepository(basket);
    const discounts = createDiscountQuotePort();

    const result = await new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand(BASKET_ID, 'SAVE10'));

    expect(result.basketId).toBe(BASKET_ID);
    expect(result.coupon).toEqual(
      expect.objectContaining({ couponCode: 'SAVE10', discountType: 'percentage', discountValue: 10 }),
    );
    expect(result.discountAmountCents).toBe(1000);
    expect(repository.save).toHaveBeenCalledWith(basket);
  });

  it('should apply a fixed discount when the coupon is a fixed amount', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));
    const discounts = createDiscountQuotePort({
      valid: true,
      discount: { code: 'FLAT15', type: 'fixed_amount', value: 15, discountAmountCents: 15 },
    });

    const result = await new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand(BASKET_ID, 'FLAT15'));

    expect(result.coupon).toEqual(expect.objectContaining({ couponCode: 'FLAT15', discountType: 'fixed', discountValue: 15 }));
    expect(result.discountAmountCents).toBe(15);
  });

  it('should validate the coupon against the basket subtotalCents when checking the discount', async () => {
    const repository = createBasketRepository(
      createBasket({ customerId: 'customer-1', items: [createBasketItem({ quantity: 2 })] }),
    );
    const discounts = createDiscountQuotePort();

    await new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand(BASKET_ID, 'SAVE10'));

    expect(discounts.validateDiscount).toHaveBeenCalledWith('SAVE10', 10000, 'customer-1');
  });

  it('should emit promotion.coupon_applied when a coupon is applied', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));
    const discounts = createDiscountQuotePort();

    await new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand(BASKET_ID, 'SAVE10'));

    expect(emitMock).toHaveBeenCalledWith(
      'promotion.coupon_applied',
      expect.objectContaining({ basketId: BASKET_ID, couponCode: 'SAVE10', discountType: 'percentage', discountValue: 10, discountAmountCents: 1000 }),
    );
  });

  it('should throw BasketValidationError when the coupon is invalid', async () => {
    const repository = createBasketRepository(createBasket());
    const discounts = createDiscountQuotePort({ valid: false, error: 'Expired coupon' });

    await expect(new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand(BASKET_ID, 'EXPIRED'))).rejects.toThrow(
      BasketValidationError,
    );
  });

  it('should throw BasketValidationError when the validation succeeds without a discount', async () => {
    const repository = createBasketRepository(createBasket());
    const discounts = createDiscountQuotePort({ valid: true });

    await expect(new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand(BASKET_ID, 'EMPTY'))).rejects.toThrow(
      BasketValidationError,
    );
  });

  it('should throw CouponAlreadyAppliedError when the basket already has a coupon', async () => {
    const basket = createBasket({ items: [createBasketItem()] });
    basket.applyCoupon('FIRST', 'percentage', 10);
    const repository = createBasketRepository(basket);
    const discounts = createDiscountQuotePort();

    await expect(new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand(BASKET_ID, 'SECOND'))).rejects.toThrow(
      CouponAlreadyAppliedError,
    );
  });

  it('should throw BasketValidationError when no discount port is provided', async () => {
    const repository = createBasketRepository(createBasket());

    await expect(new ApplyCouponUseCase(repository).execute(new ApplyCouponCommand(BASKET_ID, 'SAVE10'))).rejects.toThrow(
      BasketValidationError,
    );
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);
    const discounts = createDiscountQuotePort();

    await expect(new ApplyCouponUseCase(repository, discounts).execute(new ApplyCouponCommand('missing', 'SAVE10'))).rejects.toThrow(
      BasketNotFoundError,
    );
  });
});
