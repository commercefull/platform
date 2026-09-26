import { CreateCouponUseCase } from './CreateCoupon';
import { PromotionValidationError } from '../../domain/errors/PromotionErrors';
import { lazyMock, createPromotionCoupon } from '../../tests/testUtils';
import type { CreateCouponPort } from './CreateCoupon';
import type { CreateCouponInput } from '../../domain/repositories/CouponRepository';

const makeInput = (overrides: Partial<CreateCouponInput> = {}): CreateCouponInput =>
  ({ code: 'SAVE10', name: 'Save 10', type: 'percentage', ...overrides }) as CreateCouponInput;

describe('CreateCouponUseCase', () => {
  it('should create a coupon when input is valid and code is unique', async () => {
    const coupons = lazyMock<CreateCouponPort>();
    const coupon = createPromotionCoupon({ code: 'SAVE10' });
    coupons.findByCode.mockResolvedValue(null);
    coupons.create.mockResolvedValue(coupon);
    const useCase = new CreateCouponUseCase(coupons);

    const result = await useCase.execute(makeInput());

    expect(coupons.findByCode).toHaveBeenCalledWith('SAVE10', undefined);
    expect(coupons.create).toHaveBeenCalledTimes(1);
    expect(result).toBe(coupon);
  });

  it('should reject when required fields are missing', async () => {
    const coupons = lazyMock<CreateCouponPort>();
    const useCase = new CreateCouponUseCase(coupons);

    await expect(useCase.execute(makeInput({ name: undefined }))).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    await expect(useCase.execute(makeInput({ code: undefined }))).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    await expect(useCase.execute(makeInput({ type: undefined }))).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    expect(coupons.create).not.toHaveBeenCalled();
  });

  it('should reject when the coupon code already exists', async () => {
    const coupons = lazyMock<CreateCouponPort>();
    coupons.findByCode.mockResolvedValue(createPromotionCoupon());
    const useCase = new CreateCouponUseCase(coupons);

    await expect(useCase.execute(makeInput())).rejects.toBeInstanceOf(PromotionValidationError);
    expect(coupons.create).not.toHaveBeenCalled();
  });
});
