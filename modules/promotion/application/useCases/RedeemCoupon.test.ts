jest.mock('../../infrastructure/repositories/CouponDiscountRepository', () => ({
  __esModule: true,
  default: {
    coupons: {
      findByCode: jest.fn(),
      getCustomerUsageCount: jest.fn().mockResolvedValue(0),
      calculateDiscount: jest.fn().mockReturnValue(10),
      recordUsage: jest.fn().mockResolvedValue({ promotionCouponUsageId: 'u1', promotionCouponId: 'c1', orderId: 'o1' }),
    },
  },
}));

import { RedeemCouponUseCase, RedeemCouponCommand } from './RedeemCoupon';
import couponDiscountRepository from '../../infrastructure/repositories/CouponDiscountRepository';

describe('RedeemCouponUseCase', () => {
  let useCase: RedeemCouponUseCase;
  let mockCouponRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCouponRepo = couponDiscountRepository.coupons as unknown as Record<string, jest.Mock>;
    mockCouponRepo.findByCode.mockResolvedValue({
      promotionCouponId: 'c1', code: 'SAVE10', isActive: true, usageCount: 0,
      maxUsage: 100, minOrderAmount: 50, startDate: null, endDate: null,
    });
    useCase = new RedeemCouponUseCase();
  });

  it('should redeem coupon successfully (happy path)', async () => {
    const result = await useCase.execute(new RedeemCouponCommand('SAVE10', 'o1', 100, 10));

    expect(result.success).toBe(true);
    expect(result.usage!.promotionCouponUsageId).toBe('u1');
    expect(mockCouponRepo.recordUsage).toHaveBeenCalledWith('c1', 'o1', undefined);
  });

  it('should return failure when orderId is empty', async () => {
    const result = await useCase.execute(new RedeemCouponCommand('SAVE10', '', 100, 10));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('order_id_required');
  });

  it('should return failure when discount amount is negative', async () => {
    const result = await useCase.execute(new RedeemCouponCommand('SAVE10', 'o1', 100, -5));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('invalid_discount');
  });

  it('should return failure when coupon validation fails', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(null);

    const result = await useCase.execute(new RedeemCouponCommand('MISSING', 'o1', 100, 10));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('coupon_not_found');
  });
});
