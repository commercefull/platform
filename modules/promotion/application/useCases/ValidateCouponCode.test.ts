import { ValidateCouponCodeUseCase } from './ValidateCouponCode';
import { PromotionValidationError } from '../../domain/errors/PromotionErrors';
import { lazyMock, createPromotionCoupon } from '../../tests/testUtils';
import type { ValidateCouponCodePort } from './ValidateCouponCode';

describe('ValidateCouponCodeUseCase', () => {
  it('should return the repository validation result for a valid coupon', async () => {
    const coupons = lazyMock<ValidateCouponCodePort>();
    const result = { valid: true, coupon: createPromotionCoupon() };
    coupons.validate.mockResolvedValue(result);
    const useCase = new ValidateCouponCodeUseCase(coupons);

    const actual = await useCase.execute({
      code: 'SAVE10',
      orderTotalCents: '10000',
      customerId: 'cust-1',
      organizationId: 'org-1',
    });

    expect(coupons.validate).toHaveBeenCalledWith('SAVE10', 10000, 'cust-1', 'org-1');
    expect(actual).toBe(result);
  });

  it('should return an invalid result when the repository rejects the coupon', async () => {
    const coupons = lazyMock<ValidateCouponCodePort>();
    coupons.validate.mockResolvedValue({ valid: false, message: 'expired' });
    const useCase = new ValidateCouponCodeUseCase(coupons);

    const actual = await useCase.execute({ code: 'OLD', orderTotalCents: '500' });

    expect(actual.valid).toBe(false);
  });

  it('should reject when code or order total is missing', async () => {
    const coupons = lazyMock<ValidateCouponCodePort>();
    const useCase = new ValidateCouponCodeUseCase(coupons);

    await expect(
      useCase.execute({ code: '', orderTotalCents: '100' }),
    ).rejects.toBeInstanceOf(PromotionValidationError);
    await expect(
      useCase.execute({ code: 'X', orderTotalCents: undefined as unknown as string }),
    ).rejects.toBeInstanceOf(PromotionValidationError);
    expect(coupons.validate).not.toHaveBeenCalled();
  });
});
