import { CalculateCouponDiscountUseCase } from './CalculateCouponDiscount';
import { CouponNotFoundError, PromotionValidationError } from '../../domain/errors/PromotionErrors';
import { lazyMock, createPromotionCoupon } from '../../tests/testUtils';
import type { CalculateCouponDiscountPort } from './CalculateCouponDiscount';

describe('CalculateCouponDiscountUseCase', () => {
  it('should calculate the discount and final total', async () => {
    const coupons = lazyMock<CalculateCouponDiscountPort>();
    const coupon = createPromotionCoupon({ code: 'SAVE10' });
    coupons.findByCode.mockResolvedValue(coupon);
    coupons.calculateDiscount.mockReturnValue(2500);
    const useCase = new CalculateCouponDiscountUseCase(coupons);

    const result = await useCase.execute({ code: 'SAVE10', orderTotalCents: '10000', organizationId: 'org-1' });

    expect(coupons.findByCode).toHaveBeenCalledWith('SAVE10', 'org-1');
    expect(coupons.calculateDiscount).toHaveBeenCalledWith(coupon, 10000);
    expect(result).toEqual({
      coupon,
      orderTotalCents: 10000,
      discountAmountCents: 2500,
      finalTotalCents: 7500,
    });
  });

  it('should throw CouponNotFoundError when the code does not match a coupon', async () => {
    const coupons = lazyMock<CalculateCouponDiscountPort>();
    coupons.findByCode.mockResolvedValue(null);
    const useCase = new CalculateCouponDiscountUseCase(coupons);

    await expect(useCase.execute({ code: 'NOPE', orderTotalCents: '100' })).rejects.toBeInstanceOf(
      CouponNotFoundError,
    );
  });

  it('should reject when code or order total is missing', async () => {
    const coupons = lazyMock<CalculateCouponDiscountPort>();
    const useCase = new CalculateCouponDiscountUseCase(coupons);

    await expect(useCase.execute({ code: '', orderTotalCents: '100' })).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    await expect(
      useCase.execute({ code: 'X', orderTotalCents: undefined as unknown as string }),
    ).rejects.toBeInstanceOf(PromotionValidationError);
    expect(coupons.findByCode).not.toHaveBeenCalled();
  });
});
