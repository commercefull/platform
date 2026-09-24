import '../../tests/testUtils';
import { RedeemRewardUseCase } from './RedeemReward';
import {
  LoyaltyRewardNotFoundError,
  RewardNotAvailableError,
  InsufficientPointsError,
  LoyaltyMemberNotFoundError,
} from '../../domain/errors/LoyaltyErrors';
import { createRedeemRewardRepository, emitMock } from '../../tests/testUtils';

describe('RedeemRewardUseCase', () => {
  const loyaltyRepository = createRedeemRewardRepository();
  const useCase = new RedeemRewardUseCase(loyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.getRewardById.mockResolvedValue({
      rewardId: 'rwd1',
      name: '10% Off',
      type: 'discount',
      pointsCost: 100,
      value: 10,
      valueType: 'percentage',
      isActive: true,
      totalQuantity: 100,
      remainingQuantity: 100,
      maxUsagePerCustomer: null,
    });
    loyaltyRepository.getCustomerLoyalty.mockResolvedValue({ pointsBalance: 500 });
    loyaltyRepository.getRewardUsageCount.mockResolvedValue(0);
    loyaltyRepository.updatePointsBalance.mockResolvedValue(undefined);
    loyaltyRepository.createTransaction.mockResolvedValue(undefined);
    loyaltyRepository.createRedemption.mockResolvedValue({ redemptionId: 'red1' });
    loyaltyRepository.generateRedemptionCoupon.mockResolvedValue('CODE-123');
    loyaltyRepository.decrementRewardQuantity.mockResolvedValue(undefined);
  });

  it('should redeem the reward, deduct points and emit loyalty.reward_redeemed', async () => {
    const result = await useCase.execute({ customerId: 'c1', rewardId: 'rwd1' });

    expect(result.rewardId).toBe('rwd1');
    expect(result.pointsSpent).toBe(100);
    expect(loyaltyRepository.updatePointsBalance).toHaveBeenCalled();
    expect(loyaltyRepository.decrementRewardQuantity).toHaveBeenCalledWith('rwd1');
    expect(emitMock).toHaveBeenCalledWith(
      'loyalty.reward_redeemed',
      expect.objectContaining({ customerId: 'c1', rewardId: 'rwd1' }),
    );
  });

  it('should throw LoyaltyRewardNotFoundError when the reward does not exist', async () => {
    loyaltyRepository.getRewardById.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', rewardId: 'missing' })).rejects.toThrow(LoyaltyRewardNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw RewardNotAvailableError when the reward is inactive', async () => {
    loyaltyRepository.getRewardById.mockResolvedValue({
      rewardId: 'rwd1',
      name: 'Test',
      type: 'discount',
      pointsCost: 100,
      isActive: false,
      totalQuantity: 10,
      remainingQuantity: 10,
    });

    await expect(useCase.execute({ customerId: 'c1', rewardId: 'rwd1' })).rejects.toThrow(RewardNotAvailableError);
  });

  it('should throw LoyaltyMemberNotFoundError when the customer has no loyalty record', async () => {
    loyaltyRepository.getCustomerLoyalty.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'missing', rewardId: 'rwd1' })).rejects.toThrow(LoyaltyMemberNotFoundError);
  });

  it('should throw InsufficientPointsError when the balance is below the points cost', async () => {
    loyaltyRepository.getCustomerLoyalty.mockResolvedValue({ pointsBalance: 50 });

    await expect(useCase.execute({ customerId: 'c1', rewardId: 'rwd1' })).rejects.toThrow(InsufficientPointsError);
    expect(loyaltyRepository.updatePointsBalance).not.toHaveBeenCalled();
  });
});
