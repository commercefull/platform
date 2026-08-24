jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RedeemRewardUseCase} from './RedeemReward';
import { LoyaltyRewardNotFoundError, RewardNotAvailableError, InsufficientPointsError, LoyaltyMemberNotFoundError } from '../../domain/errors/LoyaltyErrors';

describe('RedeemRewardUseCase', () => {
  let useCase: RedeemRewardUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getRewardById: jest.fn().mockResolvedValue({
        rewardId: 'rwd1', name: '10% Off', type: 'discount', pointsCost: 100, value: 10, valueType: 'percentage',
        isActive: true, totalQuantity: null, remainingQuantity: 100, maxUsagePerCustomer: null,
      }),
      getCustomerLoyalty: jest.fn().mockResolvedValue({ pointsBalance: 500 }),
      getRewardUsageCount: jest.fn().mockResolvedValue(0),
      updatePointsBalance: jest.fn().mockResolvedValue(undefined),
      createTransaction: jest.fn().mockResolvedValue(undefined),
      decrementRewardQuantity: jest.fn().mockResolvedValue(undefined),
      createRedemption: jest.fn().mockResolvedValue({ redemptionId: 'red1', expiresAt: new Date() }),
      generateRedemptionCoupon: jest.fn().mockResolvedValue('COUPON123'),
    };
    useCase = new RedeemRewardUseCase(mockRepo as never);
  });

  it('should redeem reward (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1', rewardId: 'rwd1' });

    expect(result.redemptionId).toBe('red1');
    expect(result.pointsSpent).toBe(100);
    expect(result.remainingBalance).toBe(400);
    expect(result.couponCode).toBe('COUPON123');
  });

  it('should throw LoyaltyRewardNotFoundError when reward not found', async () => {
    mockRepo.getRewardById.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', rewardId: 'missing' })).rejects.toThrow(LoyaltyRewardNotFoundError);
  });

  it('should throw RewardNotAvailableError when reward is inactive', async () => {
    mockRepo.getRewardById.mockResolvedValue({ rewardId: 'rwd1', name: 'Test', type: 'discount', pointsCost: 100, isActive: false, remainingQuantity: 10 });

    await expect(useCase.execute({ customerId: 'c1', rewardId: 'rwd1' })).rejects.toThrow(RewardNotAvailableError);
  });

  it('should throw LoyaltyMemberNotFoundError when customer not found', async () => {
    mockRepo.getCustomerLoyalty.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'missing', rewardId: 'rwd1' })).rejects.toThrow(LoyaltyMemberNotFoundError);
  });

  it('should throw InsufficientPointsError when not enough points', async () => {
    mockRepo.getCustomerLoyalty.mockResolvedValue({ pointsBalance: 50 });

    await expect(useCase.execute({ customerId: 'c1', rewardId: 'rwd1' })).rejects.toThrow(InsufficientPointsError);
  });
});
