/**
 * Loyalty repository types — shared between loyaltyRepo and its query helpers.
 */

import type {
  LoyaltyTier as DbLoyaltyTier,
  LoyaltyPoints as DbLoyaltyPoints,
  LoyaltyTransaction as DbLoyaltyTransaction,
  LoyaltyReward as DbLoyaltyReward,
  LoyaltyRedemption as DbLoyaltyRedemption,
} from '../../../../libs/db/types';

// ============================================================================
// Re-export types
// ============================================================================

export type LoyaltyTier = DbLoyaltyTier;
export type LoyaltyPoints = DbLoyaltyPoints;
export type LoyaltyTransaction = DbLoyaltyTransaction;
export type LoyaltyReward = DbLoyaltyReward;
export type LoyaltyRedemption = DbLoyaltyRedemption;

export enum LoyaltyPointsAction {
  PURCHASE = 'purchase',
  REVIEW = 'review',
  REFERRAL = 'referral',
  SIGNUP = 'signup',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  REDEMPTION = 'redemption',
  EXPIRATION = 'expiration',
}

// ============================================================================
// Input Types
// ============================================================================

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

export interface CreateLoyaltyTransactionInput {
  customerId: string;
  orderId?: string;
  action: string;
  points: number;
  description?: string;
  referenceId?: string;
}

