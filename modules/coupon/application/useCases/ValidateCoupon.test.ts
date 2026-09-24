import { createCoupon, createCouponRepository } from '../../tests/testUtils';
import { ValidateCouponUseCase, ValidateCouponCommand } from './ValidateCoupon';

describe('ValidateCouponUseCase', () => {
  it('should return a valid result when the coupon code validates', async () => {
    const repository = createCouponRepository();
    repository.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: createCoupon({ applicableProducts: ['prod-1', 'prod-2'] }),
      discountAmountCents: 15,
    });

    const result = await new ValidateCouponUseCase(repository).execute(
      new ValidateCouponCommand('SAVE10', 100, 'customer-1', [
        { productId: 'prod-1', quantity: 2, priceCents: 30 },
        { productId: 'prod-3', quantity: 1, priceCents: 40 },
      ]),
    );

    expect(result.valid).toBe(true);
    expect(result.coupon?.discountAmountCents).toBe(15);
    expect(repository.validateCouponCode).toHaveBeenCalledWith('SAVE10', 100, 'customer-1');
  });

  it('should return invalid when the repository rejects the code', async () => {
    const repository = createCouponRepository();
    repository.validateCouponCode.mockResolvedValue({ valid: false, error: 'Coupon expired' });

    const result = await new ValidateCouponUseCase(repository).execute(new ValidateCouponCommand('EXPIRED', 100));

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Coupon expired');
  });

  it('should return invalid with a default error when the repository gives none', async () => {
    const repository = createCouponRepository();
    repository.validateCouponCode.mockResolvedValue({ valid: false });

    const result = await new ValidateCouponUseCase(repository).execute(new ValidateCouponCommand('BAD', 100));

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid coupon');
  });

  it('should calculate item-level discounts when items match applicable products', async () => {
    const repository = createCouponRepository();
    repository.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: createCoupon({ value: 25, applicableProducts: ['prod-1'] }),
    });

    const result = await new ValidateCouponUseCase(repository).execute(
      new ValidateCouponCommand('SAVE10', 100, 'customer-1', [
        { productId: 'prod-1', quantity: 4, priceCents: 10 },
        { productId: 'prod-2', quantity: 1, priceCents: 60 },
      ]),
    );

    expect(result.applicableItems).toEqual([{ productId: 'prod-1', discountAmountCents: 10 }]); // 25% of 4 × 10
  });

  it('should omit applicableItems when no items are provided', async () => {
    const repository = createCouponRepository();
    repository.validateCouponCode.mockResolvedValue({ valid: true, coupon: createCoupon() });

    const result = await new ValidateCouponUseCase(repository).execute(new ValidateCouponCommand('SAVE10', 100, 'customer-1'));

    expect(result.valid).toBe(true);
    expect(result.applicableItems).toBeUndefined();
  });
});
