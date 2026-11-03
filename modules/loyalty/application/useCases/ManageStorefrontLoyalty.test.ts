import '../../tests/testUtils';
import { ManageStorefrontLoyaltyUseCase } from './ManageStorefrontLoyalty';
import { createStorefrontLoyaltyRepositories, createLoyaltyReward, createLoyaltyPoints } from '../../tests/testUtils';

describe('ManageStorefrontLoyaltyUseCase', () => {
  const { storefrontLoyaltyRepository, loyaltyPointsRepository } = createStorefrontLoyaltyRepositories();
  const useCase = new ManageStorefrontLoyaltyUseCase(storefrontLoyaltyRepository, loyaltyPointsRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the member with tier information', async () => {
    storefrontLoyaltyRepository.findMemberWithTier.mockResolvedValue({ memberId: 'm1' });

    const result = await useCase.findMemberWithTier('c1');

    expect(result).toEqual({ memberId: 'm1' });
  });

  it('should return the customer transaction count', async () => {
    storefrontLoyaltyRepository.countCustomerTransactions.mockResolvedValue(5);

    const result = await useCase.countCustomerTransactions('c1');

    expect(result).toBe(5);
  });

  it('should return rewards available at the given points balance', async () => {
    storefrontLoyaltyRepository.findAvailableRewards.mockResolvedValue([createLoyaltyReward()]);

    const result = await useCase.findAvailableRewards(500);

    expect(result).toHaveLength(1);
    expect(storefrontLoyaltyRepository.findAvailableRewards).toHaveBeenCalledWith(500);
  });

  it('should redeem points through the canonical points adjustment', async () => {
    loyaltyPointsRepository.adjustCustomerPoints.mockResolvedValue(createLoyaltyPoints());

    await useCase.redeemPoints('c1', 100, 'Redeemed: Reward');

    expect(loyaltyPointsRepository.adjustCustomerPoints).toHaveBeenCalledWith({
      customerId: 'c1',
      pointsChange: -100,
      action: 'redemption',
      description: 'Redeemed: Reward',
    });
  });
});
