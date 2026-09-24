/**
 * Membership Repository Interface
 */

import { MembershipTier } from '../entities/MembershipTier';

export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'lifetime';

export interface MembershipPlan {
  membershipPlanId: string;
  name: string;
  code: string;
  description: string | null;
  shortDescription: string | null;
  isActive: boolean;
  isPublic: boolean;
  isDefault: boolean;
  priority: number;
  level: number;
  trialDays: number;
  priceCents: number;
  salePriceCents: number | null;
  setupFeeCents: number;
  currency: string;
  billingCycle: BillingCycle;
  billingPeriod: number;
  maxMembers: number | null;
  autoRenew: boolean;
  duration: number | null;
  gracePeriodsAllowed: number;
  gracePeriodDays: number;
  membershipImage: string | null;
  publicDetails: Record<string, unknown> | null;
  privateMeta: Record<string, unknown> | null;
  visibilityRules: Record<string, unknown> | null;
  availabilityRules: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export type CreateMembershipPlanInput = Omit<MembershipPlan, 'membershipPlanId' | 'createdAt' | 'updatedAt'>;
export type UpdateMembershipPlanInput = Partial<
  Omit<MembershipPlan, 'membershipPlanId' | 'code' | 'createdAt' | 'updatedAt'>
>;

export interface MembershipPlanBenefit {
  membershipPlanBenefitId: string;
  createdAt: string;
  updatedAt: string;
  planId: string;
  benefitId: string;
  isActive: boolean;
  priority: number;
  valueOverride?: Record<string, unknown>;
  rulesOverride?: Record<string, unknown>;
  notes?: string;
}

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
