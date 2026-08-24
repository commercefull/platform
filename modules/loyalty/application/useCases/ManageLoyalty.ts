import loyaltyDataRepository from '../../infrastructure/repositories/LoyaltyDataRepository';

const loyaltyRepo = loyaltyDataRepository.points;
const storefrontLoyaltyRepo = loyaltyDataRepository.storefront;

export class ManageLoyaltyAdminUseCase {
  async findAllTiers(includeInactive?: boolean) {
    return loyaltyRepo.findAllTiers(includeInactive);
  }
  async findTierById(id: string) {
    return loyaltyRepo.findTierById(id);
  }
  async createTier(input: Parameters<typeof loyaltyRepo.createTier>[0]) {
    return loyaltyRepo.createTier(input);
  }
  async updateTier(id: string, input: Parameters<typeof loyaltyRepo.updateTier>[1]) {
    return loyaltyRepo.updateTier(id, input);
  }
  async deleteTier(id: string) {
    return loyaltyRepo.deleteTier(id);
  }
  async findAllRewards(includeInactive?: boolean) {
    return loyaltyRepo.findAllRewards(includeInactive);
  }
  async findRewardById(id: string) {
    return loyaltyRepo.findRewardById(id);
  }
  async createReward(input: Parameters<typeof loyaltyRepo.createReward>[0]) {
    return loyaltyRepo.createReward(input);
  }
  async updateReward(id: string, input: Parameters<typeof loyaltyRepo.updateReward>[1]) {
    return loyaltyRepo.updateReward(id, input);
  }
  async deleteReward(id: string) {
    return loyaltyRepo.deleteReward(id);
  }
  async findCustomerPointsWithTier(customerId: string) {
    return loyaltyRepo.findCustomerPointsWithTier(customerId);
  }
  async findCustomerTransactions(customerId: string, limit?: number) {
    return loyaltyRepo.findCustomerTransactions(customerId, limit);
  }
  async findCustomerRedemptions(customerId: string, limit?: number) {
    return loyaltyRepo.findCustomerRedemptions(customerId, limit);
  }
}

export class ManageStorefrontLoyaltyUseCase {
  async findMemberWithTier(customerId: string) {
    return storefrontLoyaltyRepo.findMemberWithTier(customerId);
  }
  async findCustomerTransactions(customerId: string, limit: number, offset: number) {
    return storefrontLoyaltyRepo.findCustomerTransactions(customerId, limit, offset);
  }
  async countCustomerTransactions(customerId: string) {
    return storefrontLoyaltyRepo.countCustomerTransactions(customerId);
  }
  async findAvailableRewards(pointsBalance: number) {
    return storefrontLoyaltyRepo.findAvailableRewards(pointsBalance);
  }
  async findRewardById(rewardId: string) {
    return storefrontLoyaltyRepo.findRewardById(rewardId);
  }
  async findMemberByCustomerId(customerId: string) {
    return storefrontLoyaltyRepo.findMemberByCustomerId(customerId);
  }
  async deductPoints(customerId: string, points: number) {
    return storefrontLoyaltyRepo.deductPoints(customerId, points);
  }
  async createRedeemTransaction(customerId: string, points: number, description: string) {
    return storefrontLoyaltyRepo.createRedeemTransaction(customerId, points, description);
  }
}
