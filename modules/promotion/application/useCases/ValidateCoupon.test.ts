import '../../tests/testUtils';
import { ValidateCouponUseCase, ValidateCouponCommand } from './ValidateCoupon';
import { createValidateCouponRepository, createPromotionCoupon } from '../../tests/testUtils';

describe('ValidateCouponUseCase', () => {
  const couponRepository = createValidateCouponRepository();
  const useCase = new ValidateCouponUseCase(couponRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon());
    couponRepository.getCustomerUsageCount.mockResolvedValue(0);
    couponRepository.calculateDiscount.mockReturnValue(10);
  });

  it('should return a valid result with the discount amount when the coupon is valid', async () => {
    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10);
    expect(result.coupon?.code).toBe('SAVE10');
    expect(couponRepository.findByCode).toHaveBeenCalledWith('SAVE10', undefined);
    expect(couponRepository.calculateDiscount).toHaveBeenCalledWith(expect.objectContaining({ promotionCouponId: 'coupon-1' }), 100);
  });

  it('should return code_required when the code is empty', async () => {
    const result = await useCase.execute(new ValidateCouponCommand('', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('code_required');
    expect(couponRepository.findByCode).not.toHaveBeenCalled();
  });

  it('should return invalid_order_total when the order total is negative', async () => {
    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', -5));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('invalid_order_total');
    expect(couponRepository.findByCode).not.toHaveBeenCalled();
  });

  it('should return coupon_not_found when the code does not exist', async () => {
    couponRepository.findByCode.mockResolvedValue(null);

    const result = await useCase.execute(new ValidateCouponCommand('MISSING', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_not_found');
  });

  it('should return coupon_inactive when the coupon is disabled', async () => {
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon({ isActive: false }));

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_inactive');
  });

  it('should return coupon_not_started when the coupon starts in the future', async () => {
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon({ startDate: new Date('2999-01-01') }));

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_not_started');
  });

  it('should return coupon_expired when the coupon end date has passed', async () => {
    couponRepository.findByCode.mockResolvedValue(
      createPromotionCoupon({ startDate: new Date('2020-01-01'), endDate: new Date('2020-12-31') }),
    );

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_expired');
  });

  it('should return usage_limit_reached when the coupon usage count is exhausted', async () => {
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon({ maxUsage: 5, usageCount: 5 }));

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('usage_limit_reached');
  });

  it('should return min_order_not_met when the order total is below the minimum', async () => {
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon({ minOrderAmount: 200 }));

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('min_order_not_met');
  });

  it('should return customer_usage_limit_reached when the customer exceeded their limit', async () => {
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon({ maxUsagePerCustomer: 1 }));
    couponRepository.getCustomerUsageCount.mockResolvedValue(1);

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100, 'cust-1'));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('customer_usage_limit_reached');
    expect(couponRepository.getCustomerUsageCount).toHaveBeenCalledWith('coupon-1', 'cust-1');
  });

  it('should skip the per-customer check when no customerId is provided', async () => {
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon({ maxUsagePerCustomer: 1 }));

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(true);
    expect(couponRepository.getCustomerUsageCount).not.toHaveBeenCalled();
  });
});
