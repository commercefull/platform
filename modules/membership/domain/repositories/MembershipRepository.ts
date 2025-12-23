/**
 * Membership Repository Interface
 */

import { MembershipTier } from '../entities/MembershipTier';

export interface UserMembership {
  membershipId: string;
  customerId: string;
  tierId: string;
  tierName: string;
  points: number;
  lifetimePoints: number;
  startDate: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface MembershipRepository {
  // Tiers
  findTierById(tierId: string): Promise<MembershipTier | null>;
  findTierByLevel(level: number): Promise<MembershipTier | null>;
  findAllTiers(): Promise<MembershipTier[]>;
  saveTier(tier: MembershipTier): Promise<MembershipTier>;
  deleteTier(tierId: string): Promise<void>;

  // User memberships
  findUserMembership(customerId: string): Promise<UserMembership | null>;
  createUserMembership(customerId: string, tierId: string): Promise<UserMembership>;
  upgradeTier(customerId: string, newTierId: string): Promise<UserMembership>;
  addPoints(customerId: string, points: number, reason: string): Promise<number>;
  redeemPoints(customerId: string, points: number, orderId?: string): Promise<number>;
  getPointsHistory(
    customerId: string,
    limit?: number,
  ): Promise<
    Array<{
      transactionId: string;
      type: 'earn' | 'redeem' | 'expire' | 'adjust';
      points: number;
      reason: string;
      createdAt: Date;
    }>
  >;
}
