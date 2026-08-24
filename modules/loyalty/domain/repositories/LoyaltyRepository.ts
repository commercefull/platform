/**
 * Loyalty Repository Port
 *
 * Domain interface for loyalty data access (tiers, points, transactions, rewards, redemptions).
 */

import type {
  LoyaltyTier,
  LoyaltyPoints,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRedemption,
} from 'libs/db/types';

export interface CreateLoyaltyTierInput {
  name: string;
  description?: string;
  type: string;
  level?: number;
  pointsThreshold: number;
  multiplier: number;
  benefits?: unknown;
  isActive?: boolean;
}

export interface UpdateLoyaltyTierInput {
  name?: string;
  description?: string;
  type?: string;
  pointsThreshold?: number;
  multiplier?: number;
  benefits?: unknown;
  isActive?: boolean;
}

export interface CreateLoyaltyRewardInput {
  name: string;
  description?: string;
  type?: string;
  pointsCost: number;
  discountAmount?: number;
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
  discountAmount?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping?: boolean;
  productIds?: unknown;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface CreateLoyaltyTransactionInput {
  customerId: string;
  orderId?: string;
  action: string;
  points: number;
  description?: string;
  referenceId?: string;
}

export type TransactionType = 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus' | 'refund';

export interface CustomerLoyaltyTransaction {
  customerLoyaltyTransactionId: string;
  createdAt: string;
  customerId: string;
  type: TransactionType;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string;
  description?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export type CustomerLoyaltyTransactionCreateParams = Omit<CustomerLoyaltyTransaction, 'customerLoyaltyTransactionId' | 'createdAt'>;

export interface LoyaltyRepository {
  // Tier Management
  findTierById(tierId: string): Promise<LoyaltyTier | null>;
  findAllTiers(includeInactive?: boolean): Promise<LoyaltyTier[]>;
  findTierByPointsThreshold(points: number): Promise<LoyaltyTier | null>;
  createTier(input: CreateLoyaltyTierInput): Promise<LoyaltyTier>;
  updateTier(tierId: string, input: UpdateLoyaltyTierInput): Promise<LoyaltyTier>;
  deleteTier(tierId: string): Promise<boolean>;

  // Customer Points
  findCustomerPoints(customerId: string): Promise<LoyaltyPoints | null>;
  findCustomerPointsWithTier(customerId: string): Promise<{ points: LoyaltyPoints; tier: LoyaltyTier } | null>;
  initializeCustomerPoints(customerId: string, tierId: string): Promise<LoyaltyPoints>;
  adjustCustomerPoints(
    customerId: string,
    pointsChange: number,
    action: string,
    description?: string,
    orderId?: string,
    referenceId?: string,
  ): Promise<LoyaltyPoints>;
  checkAndUpdateTier(customerId: string, lifetimePoints: number): Promise<void>;

  // Transactions
  findTransactionById(loyaltyTransactionId: string): Promise<LoyaltyTransaction | null>;
  findCustomerTransactions(customerId: string, limit?: number): Promise<LoyaltyTransaction[]>;
  createTransaction(input: CreateLoyaltyTransactionInput): Promise<LoyaltyTransaction>;

  // Rewards
  findRewardById(rewardId: string): Promise<LoyaltyReward | null>;
  findAllRewards(includeInactive?: boolean): Promise<LoyaltyReward[]>;
  findAvailableRewards(currentPoints: number): Promise<LoyaltyReward[]>;
  createReward(input: CreateLoyaltyRewardInput): Promise<LoyaltyReward>;
  updateReward(rewardId: string, input: UpdateLoyaltyRewardInput): Promise<LoyaltyReward>;
  deleteReward(rewardId: string): Promise<boolean>;

  // Redemptions
  findRedemptionById(loyaltyRedemptionId: string): Promise<LoyaltyRedemption | null>;
  findRedemptionByCode(redemptionCode: string): Promise<LoyaltyRedemption | null>;
  findCustomerRedemptions(customerId: string, limit?: number): Promise<LoyaltyRedemption[]>;
  redeemReward(customerId: string, rewardId: string): Promise<LoyaltyRedemption>;
  updateRedemptionStatus(loyaltyRedemptionId: string, status: 'pending' | 'used' | 'expired' | 'cancelled'): Promise<LoyaltyRedemption>;

  // Order Points
  processOrderPoints(customerId: string, orderId: string, orderAmount: number): Promise<LoyaltyPoints>;

  // Customer Loyalty Transactions
  findCustomerLoyaltyTransactionById(id: string): Promise<CustomerLoyaltyTransaction | null>;
  findCustomerLoyaltyTransactions(customerId: string, limit?: number, offset?: number): Promise<CustomerLoyaltyTransaction[]>;
  findCustomerLoyaltyTransactionsByType(customerId: string, type: TransactionType): Promise<CustomerLoyaltyTransaction[]>;
  findCustomerLoyaltyTransactionsByOrderId(orderId: string): Promise<CustomerLoyaltyTransaction[]>;
  findExpiringCustomerLoyaltyTransactions(customerId: string, days?: number): Promise<CustomerLoyaltyTransaction[]>;
  createCustomerLoyaltyTransaction(params: CustomerLoyaltyTransactionCreateParams): Promise<CustomerLoyaltyTransaction>;
  getCurrentBalance(customerId: string): Promise<number>;
  getTotalEarned(customerId: string): Promise<number>;
  getTotalRedeemed(customerId: string): Promise<number>;
  deleteCustomerLoyaltyTransaction(id: string): Promise<boolean>;

  // Storefront
  findMemberWithTier(customerId: string): Promise<unknown | null>;
  findMemberByCustomerId(customerId: string): Promise<unknown | null>;
  findStorefrontAvailableRewards(pointsBalance: number): Promise<unknown[]>;
  findStorefrontRewardById(rewardId: string): Promise<unknown | null>;
  deductPoints(customerId: string, points: number): Promise<void>;
  createRedeemTransaction(customerId: string, points: number, description: string): Promise<void>;
}
