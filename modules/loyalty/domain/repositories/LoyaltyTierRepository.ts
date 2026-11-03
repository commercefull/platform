/**
 * Loyalty Tier Repository Port
 *
 * Domain interface for loyalty tier persistence.
 */

import type { LoyaltyTier } from '../entities/LoyaltyModel';

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

export interface LoyaltyTierRepository {
  findTierById(tierId: string): Promise<LoyaltyTier | null>;
  findAllTiers(includeInactive?: boolean): Promise<LoyaltyTier[]>;
  findTierByPointsThreshold(points: number): Promise<LoyaltyTier | null>;
  createTier(input: CreateLoyaltyTierInput): Promise<LoyaltyTier>;
  updateTier(tierId: string, input: UpdateLoyaltyTierInput): Promise<LoyaltyTier>;
  deleteTier(tierId: string): Promise<boolean>;
}
