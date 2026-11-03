import type { StorefrontLoyaltyRepository } from '../../domain/repositories/StorefrontLoyaltyRepository';
import type { LoyaltyPointsRepository } from '../../domain/repositories/LoyaltyPointsRepository';

export class ManageStorefrontLoyaltyUseCase {
  constructor(
    private readonly storefrontLoyaltyRepo: StorefrontLoyaltyRepository,
    private readonly loyaltyPoints: Pick<LoyaltyPointsRepository, 'adjustCustomerPoints'>,
  ) {}

  async findMemberWithTier(customerId: string) {
    return this.storefrontLoyaltyRepo.findMemberWithTier(customerId);
  }
  async findCustomerTransactions(customerId: string, limit: number, offset: number) {
    return this.storefrontLoyaltyRepo.findCustomerTransactions(customerId, limit, offset);
  }
  async countCustomerTransactions(customerId: string) {
    return this.storefrontLoyaltyRepo.countCustomerTransactions(customerId);
  }
  async findAvailableRewards(pointsBalance: number) {
    return this.storefrontLoyaltyRepo.findAvailableRewards(pointsBalance);
  }
  async findRewardById(rewardId: string) {
    return this.storefrontLoyaltyRepo.findRewardById(rewardId);
  }
  async findMemberByCustomerId(customerId: string) {
    return this.storefrontLoyaltyRepo.findMemberByCustomerId(customerId);
  }
  async redeemPoints(customerId: string, points: number, description: string) {
    return this.loyaltyPoints.adjustCustomerPoints({
      customerId,
      pointsChange: -Math.abs(points),
      action: 'redemption',
      description,
    });
  }
}
