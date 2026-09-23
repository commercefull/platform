import { createCoupon, reconstituteCoupon, createCouponRepository, COUPON_ID } from '../../tests/testUtils';
import { ApplyCouponUseCase, ApplyCouponInput } from './ApplyCoupon';

const applyInput = (overrides: Partial<ApplyCouponInput> = {}): ApplyCouponInput => ({
  couponCode: 'SAVE10',
  basketId: 'basket-1',
  orderTotal: 100,
  ...overrides,
});

describe('ApplyCouponUseCase', () => {
  it('should apply the discount when the coupon is valid', async () => {
    const repository = createCouponRepository(createCoupon());

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(true);
    expect(result.discountAmount).toBe(10);
    expect(result.newTotal).toBe(90);
    expect(repository.recordUsage).toHaveBeenCalledWith(
      expect.objectContaining({ couponId: COUPON_ID, basketId: 'basket-1', discountAmount: 10 }),
    );
  });

  it('should apply the fixed amount when the coupon is a fixed_amount type', async () => {
    const repository = createCouponRepository(createCoupon({ type: 'fixed_amount', value: 5, currency: 'USD' }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(true);
    expect(result.discountAmount).toBe(5);
    expect(result.newTotal).toBe(95);
  });

  it('should cap the discount when it exceeds maxDiscountAmount', async () => {
    const repository = createCouponRepository(createCoupon({ value: 50, maxDiscountAmount: 20 }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.discountAmount).toBe(20);
  });

  it('should apply zero discount when the coupon is free_shipping', async () => {
    const repository = createCouponRepository(createCoupon({ type: 'free_shipping', value: 0 }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(true);
    expect(result.discountAmount).toBe(0);
    expect(result.discountType).toBe('free_shipping');
  });

  it('should not apply when the coupon does not exist', async () => {
    const repository = createCouponRepository(null);

    const result = await new ApplyCouponUseCase(repository).execute(applyInput({ couponCode: 'MISSING' }));

    expect(result.applied).toBe(false);
    expect(result.message).toBe('Invalid coupon code');
    expect(repository.recordUsage).not.toHaveBeenCalled();
  });

  it('should not apply when the coupon is inactive', async () => {
    const repository = createCouponRepository(reconstituteCoupon({ isActive: false }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(false);
    expect(result.message).toBe('Coupon is not active');
  });

  it('should not apply when the coupon has not started yet', async () => {
    const repository = createCouponRepository(createCoupon({ startsAt: new Date(Date.now() + 86400000) }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(false);
    expect(result.message).toBe('Coupon is not yet valid');
  });

  it('should not apply when the coupon has expired', async () => {
    const repository = createCouponRepository(createCoupon({ expiresAt: new Date(Date.now() - 86400000) }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(false);
    expect(result.message).toBe('Coupon has expired');
  });

  it('should not apply when the order is below the minimum order value', async () => {
    const repository = createCouponRepository(createCoupon({ minOrderValue: 200 }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(false);
    expect(result.message).toBe('Minimum order amount is 200');
  });

  it('should not apply when the coupon usage limit is reached', async () => {
    const repository = createCouponRepository(reconstituteCoupon({ usageType: 'multi_use', usageLimit: 5, usageCount: 5 }));

    const result = await new ApplyCouponUseCase(repository).execute(applyInput());

    expect(result.applied).toBe(false);
    expect(result.message).toBe('Coupon has reached maximum usage');
  });

  it('should not apply when the customer already used the coupon', async () => {
    const repository = createCouponRepository(createCoupon({ customerUsageLimit: 1 }));
    repository.getCustomerUsageCount.mockResolvedValue(1);

    const result = await new ApplyCouponUseCase(repository).execute(applyInput({ customerId: 'customer-1' }));

    expect(result.applied).toBe(false);
    expect(result.message).toBe('You have already used this coupon');
    expect(repository.getCustomerUsageCount).toHaveBeenCalledWith(COUPON_ID, 'customer-1');
  });
});
