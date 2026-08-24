import { ApplyCouponUseCase} from './ApplyCoupon';

describe('ApplyCouponUseCase', () => {
  let useCase: ApplyCouponUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByCode: jest.fn().mockResolvedValue({
        couponId: 'c1', code: 'SAVE10', type: 'percentage', value: 10,
        isActive: true, usageLimit: 100, usageCount: 0, customerUsageLimit: 1,
        startsAt: null, expiresAt: null, minOrderValue: null, maxDiscountAmount: null,
        applicableProducts: null, applicableCategories: null,
      }),
      getCustomerUsageCount: jest.fn().mockResolvedValue(0),
      recordUsage: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ApplyCouponUseCase(mockRepo as never);
  });

  it('should apply percentage coupon (happy path)', async () => {
    const result = await useCase.execute({
      couponCode: 'SAVE10', basketId: 'b1', orderTotal: 100,
    });

    expect(result.applied).toBe(true);
    expect(result.discountAmount).toBe(10);
    expect(result.newTotal).toBe(90);
    expect(mockRepo.recordUsage).toHaveBeenCalled();
  });

  it('should return not applied when coupon not found', async () => {
    mockRepo.findByCode.mockResolvedValue(null);

    const result = await useCase.execute({ couponCode: 'MISSING', basketId: 'b1', orderTotal: 100 });

    expect(result.applied).toBe(false);
    expect(result.message).toBe('Invalid coupon code');
  });

  it('should apply fixed_amount coupon', async () => {
    mockRepo.findByCode.mockResolvedValue({
      couponId: 'c2', code: 'SAVE5', type: 'fixed_amount', value: 5,
      isActive: true, usageLimit: 100, usageCount: 0, customerUsageLimit: 1,
      startsAt: null, expiresAt: null, minOrderValue: null, maxDiscountAmount: null,
    });

    const result = await useCase.execute({ couponCode: 'SAVE5', basketId: 'b1', orderTotal: 100 });

    expect(result.applied).toBe(true);
    expect(result.discountAmount).toBe(5);
  });

  it('should cap discount at maxDiscountAmount', async () => {
    mockRepo.findByCode.mockResolvedValue({
      couponId: 'c3', code: 'SAVE50', type: 'percentage', value: 50,
      isActive: true, usageLimit: 100, usageCount: 0, customerUsageLimit: 1,
      startsAt: null, expiresAt: null, minOrderValue: null, maxDiscountAmount: 20,
    });

    const result = await useCase.execute({ couponCode: 'SAVE50', basketId: 'b1', orderTotal: 100 });

    expect(result.discountAmount).toBe(20);
  });
});
