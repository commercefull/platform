import type { LoyaltyRepository } from '../../domain/repositories/LoyaltyRepository';

export class ManageLoyaltyAdminUseCase {
  constructor(private readonly loyaltyRepo: LoyaltyRepository) {}

  async findAllTiers(includeInactive?: boolean) {
    return this.loyaltyRepo.findAllTiers(includeInactive);
  }
  async findTierById(id: string) {
    return this.loyaltyRepo.findTierById(id);
  }
  async createTier(input: Parameters<LoyaltyRepository['createTier']>[0]) {
    return this.loyaltyRepo.createTier(input);
  }
  async updateTier(id: string, input: Parameters<LoyaltyRepository['updateTier']>[1]) {
    return this.loyaltyRepo.updateTier(id, input);
  }
  async deleteTier(id: string) {
    return this.loyaltyRepo.deleteTier(id);
  }
  async findAllRewards(includeInactive?: boolean) {
    return this.loyaltyRepo.findAllRewards(includeInactive);
  }
  async findRewardById(id: string) {
    return this.loyaltyRepo.findRewardById(id);
  }
  async createReward(input: Parameters<LoyaltyRepository['createReward']>[0]) {
    return this.loyaltyRepo.createReward(input);
  }
  async updateReward(id: string, input: Parameters<LoyaltyRepository['updateReward']>[1]) {
    return this.loyaltyRepo.updateReward(id, input);
  }
  async deleteReward(id: string) {
    return this.loyaltyRepo.deleteReward(id);
  }
  async findCustomerPointsWithTier(customerId: string) {
    return this.loyaltyRepo.findCustomerPointsWithTier(customerId);
  }
  async findCustomerTransactions(customerId: string, limit?: number) {
    return this.loyaltyRepo.findCustomerTransactions(customerId, limit);
  }
  async findCustomerRedemptions(customerId: string, limit?: number) {
    return this.loyaltyRepo.findCustomerRedemptions(customerId, limit);
  }
}

