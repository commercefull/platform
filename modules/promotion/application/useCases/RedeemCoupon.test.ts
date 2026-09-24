import '../../tests/testUtils';
import { RedeemCouponUseCase, RedeemCouponCommand } from './RedeemCoupon';
import { createCouponRepository, createPromotionCoupon, createPromotionCouponUsage } from '../../tests/testUtils';

describe('RedeemCouponUseCase', () => {
  const couponRepository = createCouponRepository();
  const useCase = new RedeemCouponUseCase(couponRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon());
    couponRepository.getCustomerUsageCount.mockResolvedValue(0);
    couponRepository.calculateDiscount.mockReturnValue(10);
    couponRepository.recordUsage.mockResolvedValue(createPromotionCouponUsage());
  });

  it('should record coupon usage when the coupon is valid', async () => {
    const result = await useCase.execute(new RedeemCouponCommand('SAVE10', 'order-1', 100, 10));

    expect(result.success).toBe(true);
    expect(result.usage?.promotionCouponUsageId).toBe('usage-1');
    expect(couponRepository.recordUsage).toHaveBeenCalledWith('coupon-1', 'order-1', undefined, 10);
  });

  it('should return order_id_required when the order id is empty', async () => {
    const result = await useCase.execute(new RedeemCouponCommand('SAVE10', '', 100, 10));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('order_id_required');
    expect(couponRepository.recordUsage).not.toHaveBeenCalled();
  });

  it('should return invalid_discount when the discount amount is negative', async () => {
    const result = await useCase.execute(new RedeemCouponCommand('SAVE10', 'order-1', 100, -5));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('invalid_discount');
    expect(couponRepository.recordUsage).not.toHaveBeenCalled();
  });

  it('should propagate the validation failure when the coupon is not valid', async () => {
    couponRepository.findByCode.mockResolvedValue(null);

    const result = await useCase.execute(new RedeemCouponCommand('MISSING', 'order-1', 100, 10));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('coupon_not_found');
    expect(couponRepository.recordUsage).not.toHaveBeenCalled();
  });

  it('should return redemption_failed when recording usage throws', async () => {
    couponRepository.recordUsage.mockRejectedValue(new Error('db error'));

    const result = await useCase.execute(new RedeemCouponCommand('SAVE10', 'order-1', 100, 10));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('redemption_failed');
    expect(result.message).toBe('db error');
  });
});
