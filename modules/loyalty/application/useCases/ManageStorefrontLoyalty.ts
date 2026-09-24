import type { LoyaltyRepository } from '../../domain/repositories/LoyaltyRepository';

export class ManageStorefrontLoyaltyUseCase {
  constructor(private readonly storefrontLoyaltyRepo: LoyaltyRepository) {}

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
  async deductPoints(customerId: string, points: number) {
    return this.storefrontLoyaltyRepo.deductPoints(customerId, points);
  }
  async createRedeemTransaction(customerId: string, points: number, description: string) {
    return this.storefrontLoyaltyRepo.createRedeemTransaction(customerId, points, description);
  }
}
