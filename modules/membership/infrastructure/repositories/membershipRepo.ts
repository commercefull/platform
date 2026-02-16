/**
 * Membership Repository Facade
 *
 * This provides a unified interface for membership operations, maintaining
 * backward compatibility with existing controllers while delegating to
 * specialized repositories.
 *
 * For direct access to specific entities, use the specialized repos:
 * - membershipPlanRepo.ts - Membership plans
 * - membershipBenefitRepo.ts - Benefits
 * - membershipPlanBenefitRepo.ts - Plan-benefit associations
 * - membershipSubscriptionRepo.ts - Customer subscriptions
 * - membershipPaymentRepo.ts - Payments
 */

import * as planRepo from './membershipPlanRepo';
import membershipBenefitRepo from './membershipBenefitRepo';
import membershipPlanBenefitRepo from './membershipPlanBenefitRepo';
import membershipSubscriptionRepo from './membershipSubscriptionRepo';

// Re-export types
export { MembershipPlan, BillingCycle } from './membershipPlanRepo';
export { MembershipBenefit, BenefitType, ValueType } from './membershipBenefitRepo';
export { MembershipSubscription, SubscriptionStatus } from './membershipSubscriptionRepo';
export { MembershipPlanBenefit } from './membershipPlanBenefitRepo';

// Legacy types for backward compatibility with controllers
export interface MembershipTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyMembershipBenefit {
  id: string;
  tierIds: string[];
  name: string;
  description: string;
  benefitType: string;
  discountPercentage?: number;
  discountAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembership {
  id: string;
  userId: string;
  tierId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  membershipType: 'monthly' | 'annual' | 'lifetime';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembershipWithTier extends UserMembership {
  tier: MembershipTier;
}

/**
 * MembershipRepo class - Facade for membership operations
 *
 * This class maintains backward compatibility with existing controllers
 * while delegating to the new specialized repositories.
 */
export class MembershipRepo {
  // ============================================================================
  // Plan Methods (delegates to planRepo)
  // ============================================================================

  async findTierById(id: string): Promise<MembershipTier | null> {
    const plan = await planRepo.findById(id);
    if (!plan) return null;
    return this.planToTier(plan);
  }

  async findAllTiers(includeInactive = false): Promise<MembershipTier[]> {
    const plans = await planRepo.findAll(!includeInactive);
    return plans.map(p => this.planToTier(p));
  }

  async createTier(params: Omit<MembershipTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<MembershipTier> {
    const plan = await planRepo.create({
      name: params.name,
      code: params.name.toUpperCase().replace(/\s+/g, '_'),
      description: params.description,
      price: params.monthlyPrice,
      level: params.level,
      isActive: params.isActive,
      isPublic: true,
      isDefault: false,
      priority: 0,
      trialDays: 0,
      setupFee: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      billingPeriod: 1,
      autoRenew: true,
      gracePeriodsAllowed: 0,
      gracePeriodDays: 0,
      shortDescription: null,
      salePrice: null,
      maxMembers: null,
      duration: null,
      membershipImage: null,
      publicDetails: null,
      privateMeta: null,
      visibilityRules: null,
      availabilityRules: null,
      customFields: null,
      createdBy: null,
    });
    return this.planToTier(plan);
  }

  async updateTier(id: string, params: Partial<Omit<MembershipTier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<MembershipTier> {
    const updateData: any = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.monthlyPrice !== undefined) updateData.price = params.monthlyPrice;
    if (params.level !== undefined) updateData.level = params.level;
    if (params.isActive !== undefined) updateData.isActive = params.isActive;

    const plan = await planRepo.update(id, updateData);
    if (!plan) throw new Error(`Membership tier with ID ${id} not found`);
    return this.planToTier(plan);
  }

  async deleteTier(id: string): Promise<boolean> {
    return planRepo.remove(id);
  }

  // ============================================================================
  // Benefit Methods (delegates to membershipBenefitRepo)
  // ============================================================================

  async findBenefitById(id: string): Promise<LegacyMembershipBenefit | null> {
    const benefit = await membershipBenefitRepo.findById(id);
    if (!benefit) return null;
    return this.benefitToLegacy(benefit);
  }

  async findBenefitsByTierId(tierId: string): Promise<LegacyMembershipBenefit[]> {
    const planBenefits = await membershipPlanBenefitRepo.findByPlanId(tierId, true);
    const benefits: LegacyMembershipBenefit[] = [];

    for (const pb of planBenefits) {
      const benefit = await membershipBenefitRepo.findById(pb.benefitId);
      if (benefit) {
        benefits.push(this.benefitToLegacy(benefit, [tierId]));
      }
    }

    return benefits;
  }

  async findAllBenefits(includeInactive = false): Promise<LegacyMembershipBenefit[]> {
    const benefits = await membershipBenefitRepo.findAll(!includeInactive);
    return benefits.map(b => this.benefitToLegacy(b));
  }

  async createBenefit(params: {
    name: string;
    description?: string;
    tierIds: string[];
    benefitType: string;
    discountPercentage?: number;
    discountAmount?: number;
    isActive?: boolean;
  }): Promise<LegacyMembershipBenefit> {
    const benefit = await membershipBenefitRepo.create({
      name: params.name,
      code: params.name.toUpperCase().replace(/\s+/g, '_'),
      description: params.description || null,
      shortDescription: null,
      isActive: params.isActive ?? true,
      priority: 0,
      benefitType: params.benefitType as any,
      valueType: params.discountPercentage ? 'percentage' : 'fixed',
      value: params.discountPercentage
        ? { percentage: params.discountPercentage }
        : params.discountAmount
          ? { amount: params.discountAmount }
          : null,
      icon: null,
      rules: null,
      createdBy: null,
    });

    // Link benefit to plans
    for (const planId of params.tierIds) {
      await membershipPlanBenefitRepo.create({
        planId,
        benefitId: benefit.membershipBenefitId,
        isActive: true,
        priority: 0,
      });
    }

    return this.benefitToLegacy(benefit, params.tierIds);
  }

  async updateBenefit(
    id: string,
    params: Partial<{
      name: string;
      description: string;
      tierIds: string[];
      benefitType: string;
      discountPercentage: number;
      discountAmount: number;
      isActive: boolean;
    }>,
  ): Promise<LegacyMembershipBenefit> {
    const updateData: any = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.isActive !== undefined) updateData.isActive = params.isActive;
    if (params.benefitType !== undefined) updateData.benefitType = params.benefitType;
    if (params.discountPercentage !== undefined) {
      updateData.value = { percentage: params.discountPercentage };
      updateData.valueType = 'percentage';
    }
    if (params.discountAmount !== undefined) {
      updateData.value = { amount: params.discountAmount };
      updateData.valueType = 'fixed';
    }

    const benefit = await membershipBenefitRepo.update(id, updateData);
    if (!benefit) throw new Error(`Membership benefit with ID ${id} not found`);
    return this.benefitToLegacy(benefit);
  }

  async deleteBenefit(id: string): Promise<boolean> {
    return membershipBenefitRepo.delete(id);
  }

  // ============================================================================
  // User Membership Methods (delegates to membershipSubscriptionRepo)
  // ============================================================================

  async findUserMembershipById(id: string): Promise<UserMembership | null> {
    const sub = await membershipSubscriptionRepo.findById(id);
    if (!sub) return null;
    return this.subscriptionToUserMembership(sub);
  }

  async findUserMembershipWithTier(id: string): Promise<UserMembershipWithTier | null> {
    const sub = await membershipSubscriptionRepo.findById(id);
    if (!sub) return null;

    const plan = await planRepo.findById(sub.membershipPlanId);
    if (!plan) return null;

    const membership = this.subscriptionToUserMembership(sub);
    return { ...membership, tier: this.planToTier(plan) };
  }

  async findMembershipByUserId(userId: string): Promise<UserMembership | null> {
    const subs = await membershipSubscriptionRepo.findActiveByCustomerId(userId);
    if (!subs.length) return null;
    return this.subscriptionToUserMembership(subs[0]);
  }

  async findMembershipByUserIdWithTier(userId: string): Promise<UserMembershipWithTier | null> {
    const subs = await membershipSubscriptionRepo.findActiveByCustomerId(userId);
    if (!subs.length) return null;

    const sub = subs[0];
    const plan = await planRepo.findById(sub.membershipPlanId);
    if (!plan) return null;

    const membership = this.subscriptionToUserMembership(sub);
    return { ...membership, tier: this.planToTier(plan) };
  }

  async findAllUserMemberships(limit = 50, offset = 0, filter?: { isActive?: boolean; tierId?: string }): Promise<UserMembership[]> {
    let subs: any[];

    if (filter?.tierId) {
      subs = await membershipSubscriptionRepo.findByPlanId(filter.tierId, limit, offset);
    } else if (filter?.isActive !== undefined) {
      subs = await membershipSubscriptionRepo.findByStatus(filter.isActive ? 'active' : 'cancelled', limit);
    } else {
      subs = await membershipSubscriptionRepo.findByStatus('active', limit);
    }

    return subs.map(s => this.subscriptionToUserMembership(s));
  }

  async createUserMembership(params: Omit<UserMembership, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserMembership> {
    const sub = await membershipSubscriptionRepo.create({
      customerId: params.userId,
      membershipPlanId: params.tierId,
      status: params.isActive ? 'active' : 'pending',
      startDate: new Date(params.startDate),
      endDate: params.endDate ? new Date(params.endDate) : null,
      trialEndDate: null,
      nextBillingDate: params.nextRenewalDate ? new Date(params.nextRenewalDate) : null,
      lastBillingDate: params.lastRenewalDate ? new Date(params.lastRenewalDate) : null,
      cancelledAt: null,
      cancelReason: null,
      isAutoRenew: params.autoRenew,
      priceOverride: null,
      billingCycleOverride: null,
      paymentMethodId: params.paymentMethod || null,
      notes: null,
      createdBy: null,
    });

    return this.subscriptionToUserMembership(sub);
  }

  async updateUserMembership(
    id: string,
    params: Partial<Omit<UserMembership, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<UserMembership> {
    const updateData: any = {};
    if (params.tierId !== undefined) updateData.membershipPlanId = params.tierId;
    if (params.isActive !== undefined) updateData.status = params.isActive ? 'active' : 'cancelled';
    if (params.autoRenew !== undefined) updateData.isAutoRenew = params.autoRenew;
    if (params.endDate !== undefined) updateData.endDate = new Date(params.endDate);
    if (params.nextRenewalDate !== undefined) updateData.nextBillingDate = new Date(params.nextRenewalDate);
    if (params.paymentMethod !== undefined) updateData.paymentMethodId = params.paymentMethod;

    const sub = await membershipSubscriptionRepo.update(id, updateData);
    if (!sub) throw new Error(`User membership with ID ${id} not found`);
    return this.subscriptionToUserMembership(sub);
  }

  async cancelUserMembership(id: string): Promise<UserMembership> {
    const sub = await membershipSubscriptionRepo.cancel(id);
    if (!sub) throw new Error(`User membership with ID ${id} not found`);
    return this.subscriptionToUserMembership(sub);
  }

  async getUserMembershipBenefits(userId: string): Promise<LegacyMembershipBenefit[]> {
    const membership = await this.findMembershipByUserId(userId);
    if (!membership) return [];
    return this.findBenefitsByTierId(membership.tierId);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private planToTier(plan: planRepo.MembershipPlan): MembershipTier {
    return {
      id: plan.membershipPlanId,
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: plan.price,
      annualPrice: plan.price * 12 * 0.8, // 20% annual discount
      level: plan.level,
      isActive: plan.isActive,
      createdAt: plan.createdAt.toString(),
      updatedAt: plan.updatedAt.toString(),
    };
  }

  private benefitToLegacy(benefit: any, tierIds: string[] = []): LegacyMembershipBenefit {
    const value = benefit.value || {};
    return {
      id: benefit.membershipBenefitId,
      tierIds,
      name: benefit.name,
      description: benefit.description || '',
      benefitType: benefit.benefitType,
      discountPercentage: value.percentage,
      discountAmount: value.amount,
      isActive: benefit.isActive,
      createdAt: benefit.createdAt.toString(),
      updatedAt: benefit.updatedAt.toString(),
    };
  }

  private subscriptionToUserMembership(sub: any): UserMembership {
    return {
      id: sub.membershipSubscriptionId,
      userId: sub.customerId,
      tierId: sub.membershipPlanId,
      startDate: sub.startDate?.toString() || '',
      endDate: sub.endDate?.toString() || '',
      isActive: sub.status === 'active',
      autoRenew: sub.isAutoRenew,
      membershipType: 'monthly',
      lastRenewalDate: sub.lastBillingDate?.toString(),
      nextRenewalDate: sub.nextBillingDate?.toString(),
      paymentMethod: sub.paymentMethodId,
      createdAt: sub.createdAt.toString(),
      updatedAt: sub.updatedAt.toString(),
    };
  }
}
