jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RedeemCouponUseCase} from './RedeemCoupon';
import { CouponNotFoundError } from '../../domain/errors/CouponErrors';

describe('RedeemCouponUseCase', () => {
  let useCase: RedeemCouponUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByCode: jest.fn().mockResolvedValue({ couponId: 'c1', code: 'SAVE10' }),
      createRedemption: jest.fn().mockResolvedValue(undefined),
      incrementUsageCount: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RedeemCouponUseCase(mockRepo as never);
  });

  it('should redeem coupon (happy path)', async () => {
    const result = await useCase.execute({ couponCode: 'SAVE10', orderId: 'o1', discountAmount: 10 });

    expect(result.redeemed).toBe(true);
    expect(result.couponId).toBe('c1');
    expect(mockRepo.createRedemption).toHaveBeenCalled();
    expect(mockRepo.incrementUsageCount).toHaveBeenCalledWith('c1');
  });

  it('should throw CouponNotFoundError when coupon not found', async () => {
    mockRepo.findByCode.mockResolvedValue(null);

    await expect(useCase.execute({ couponCode: 'MISSING', orderId: 'o1', discountAmount: 10 })).rejects.toThrow(CouponNotFoundError);
  });
});
