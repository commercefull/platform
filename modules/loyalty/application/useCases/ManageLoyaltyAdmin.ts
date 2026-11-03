import type { LoyaltyTierRepository } from '../../domain/repositories/LoyaltyTierRepository';
import type { LoyaltyPointsRepository } from '../../domain/repositories/LoyaltyPointsRepository';
import type { LoyaltyTransactionRepository } from '../../domain/repositories/LoyaltyTransactionRepository';
import type { LoyaltyRewardRepository } from '../../domain/repositories/LoyaltyRewardRepository';
import { LoyaltyRewardNotFoundError, LoyaltyTierNotFoundError, LoyaltyValidationError } from '../../domain/errors/LoyaltyErrors';

type LoyaltyAdminRepository = LoyaltyTierRepository & LoyaltyPointsRepository & LoyaltyTransactionRepository & LoyaltyRewardRepository;

const REDEMPTION_STATUSES = ['pending', 'used', 'expired', 'cancelled'] as const;
type RedemptionStatus = (typeof REDEMPTION_STATUSES)[number];

export class ManageLoyaltyAdminUseCase {
  constructor(private readonly loyaltyRepo: LoyaltyAdminRepository) {}

  async findAllTiers(includeInactive?: boolean) {
    return this.loyaltyRepo.findAllTiers(includeInactive);
  }
  async findTierById(id: string) {
    return this.loyaltyRepo.findTierById(id);
  }
  async getTierById(id: string) {
    const tier = await this.loyaltyRepo.findTierById(id);
    if (!tier) {
      throw new LoyaltyTierNotFoundError(id);
    }
    return tier;
  }
  async createTier(input: Omit<Parameters<LoyaltyAdminRepository['createTier']>[0], 'type'> & { type?: string }) {
    if (!input.name || input.pointsThreshold === undefined || input.multiplier === undefined) {
      throw new LoyaltyValidationError('Name, pointsThreshold, and multiplier are required');
    }
    return this.loyaltyRepo.createTier({ ...input, type: input.type || 'points' });
  }
  async updateTier(id: string, input: Parameters<LoyaltyAdminRepository['updateTier']>[1]) {
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
  async getRewardById(id: string) {
    const reward = await this.loyaltyRepo.findRewardById(id);
    if (!reward) {
      throw new LoyaltyRewardNotFoundError(id);
    }
    return reward;
  }
  async createReward(input: Parameters<LoyaltyAdminRepository['createReward']>[0]) {
    if (!input.name || input.pointsCost === undefined) {
      throw new LoyaltyValidationError('Name and pointsCost are required');
    }
    return this.loyaltyRepo.createReward(input);
  }
  async updateReward(id: string, input: Parameters<LoyaltyAdminRepository['updateReward']>[1]) {
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
  async redeemReward(customerId: string, rewardId: string) {
    return this.loyaltyRepo.redeemReward(customerId, rewardId);
  }
  async updateRedemptionStatus(redemptionId: string, status: string) {
    if (!status || !REDEMPTION_STATUSES.includes(status as RedemptionStatus)) {
      throw new LoyaltyValidationError('Valid status (pending, used, expired, or cancelled) is required');
    }
    return this.loyaltyRepo.updateRedemptionStatus(redemptionId, status as RedemptionStatus);
  }
  async processOrderPoints(orderId: string, orderAmount: string | number | undefined, customerId?: string) {
    if (!orderAmount || !customerId) {
      throw new LoyaltyValidationError('Order amountCents and customer ID are required');
    }
    return this.loyaltyRepo.processOrderPoints(
      customerId,
      orderId,
      typeof orderAmount === 'string' ? parseFloat(orderAmount) : orderAmount,
    );
  }
}
