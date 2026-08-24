jest.mock('../../infrastructure/repositories/CouponDiscountRepository', () => ({
  __esModule: true,
  default: {
    coupons: {
      findByCode: jest.fn(),
      getCustomerUsageCount: jest.fn().mockResolvedValue(0),
      calculateDiscount: jest.fn().mockReturnValue(10),
    },
  },
}));

import { ValidateCouponUseCase, ValidateCouponCommand } from './ValidateCoupon';
import couponDiscountRepository from '../../infrastructure/repositories/CouponDiscountRepository';

describe('ValidateCouponUseCase', () => {
  let useCase: ValidateCouponUseCase;
  let mockCouponRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCouponRepo = couponDiscountRepository.coupons as unknown as Record<string, jest.Mock>;
    useCase = new ValidateCouponUseCase();
  });

  it('should validate a valid coupon (happy path)', async () => {
    mockCouponRepo.findByCode.mockResolvedValue({
      promotionCouponId: 'c1', code: 'SAVE10', isActive: true, usageCount: 0,
      maxUsage: 100, minOrderAmount: 50, startDate: null, endDate: null,
    });

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10);
  });

  it('should return invalid when code is empty', async () => {
    const result = await useCase.execute(new ValidateCouponCommand('', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('code_required');
  });

  it('should return invalid when coupon not found', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(null);

    const result = await useCase.execute(new ValidateCouponCommand('MISSING', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_not_found');
  });

  it('should return invalid when coupon is inactive', async () => {
    mockCouponRepo.findByCode.mockResolvedValue({
      promotionCouponId: 'c1', code: 'SAVE10', isActive: false,
    });

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_inactive');
  });

  it('should return invalid when usage limit reached', async () => {
    mockCouponRepo.findByCode.mockResolvedValue({
      promotionCouponId: 'c1', code: 'SAVE10', isActive: true, usageCount: 100,
      maxUsage: 100, startDate: null, endDate: null,
    });

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('usage_limit_reached');
  });

  it('should return invalid when minimum order not met', async () => {
    mockCouponRepo.findByCode.mockResolvedValue({
      promotionCouponId: 'c1', code: 'SAVE10', isActive: true, usageCount: 0,
      maxUsage: 100, minOrderAmount: 200, startDate: null, endDate: null,
    });

    const result = await useCase.execute(new ValidateCouponCommand('SAVE10', 100));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('min_order_not_met');
  });
});
