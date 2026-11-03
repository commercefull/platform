/**
 * Loyalty Reward Repository Port
 *
 * Domain interface for loyalty reward and redemption persistence.
 */

import type { LoyaltyReward, LoyaltyRedemption } from '../entities/LoyaltyModel';

export interface CreateLoyaltyRewardInput {
  name: string;
  description?: string;
  type?: string;
  pointsCost: number;
  discountAmountCents?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping?: boolean;
  productIds?: unknown;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface UpdateLoyaltyRewardInput {
  name?: string;
  description?: string;
  pointsCost?: number;
  discountAmountCents?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping?: boolean;
  productIds?: unknown;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface LoyaltyRewardRepository {
  findRewardById(rewardId: string): Promise<LoyaltyReward | null>;
  findAllRewards(includeInactive?: boolean): Promise<LoyaltyReward[]>;
  findAvailableRewards(currentPoints: number): Promise<LoyaltyReward[]>;
  createReward(input: CreateLoyaltyRewardInput): Promise<LoyaltyReward>;
  updateReward(rewardId: string, input: UpdateLoyaltyRewardInput): Promise<LoyaltyReward>;
  deleteReward(rewardId: string): Promise<boolean>;

  findRedemptionById(loyaltyRedemptionId: string): Promise<LoyaltyRedemption | null>;
  findRedemptionByCode(redemptionCode: string): Promise<LoyaltyRedemption | null>;
  findCustomerRedemptions(customerId: string, limit?: number): Promise<LoyaltyRedemption[]>;
  redeemReward(customerId: string, rewardId: string): Promise<LoyaltyRedemption>;
  updateRedemptionStatus(loyaltyRedemptionId: string, status: 'pending' | 'used' | 'expired' | 'cancelled'): Promise<LoyaltyRedemption>;
}
