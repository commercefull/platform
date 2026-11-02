/**
 * Membership Repository Interface
 */


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
export type UpdateMembershipPlanInput = Partial<Omit<MembershipPlan, 'membershipPlanId' | 'code' | 'createdAt' | 'updatedAt'>>;

export interface MembershipPlanBenefit {
  membershipPlanBenefitId: string;
  createdAt: Date;
  updatedAt: Date;
  planId: string;
  benefitId: string;
  isActive: boolean;
  priority: number;
  valueOverride?: Record<string, unknown>;
  rulesOverride?: Record<string, unknown>;
  notes?: string;
}



