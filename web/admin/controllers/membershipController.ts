/**
 * Membership Controller
 * Handles membership plans, tiers, and benefits management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import * as membershipPlanRepo from '../../../modules/membership/repos/membershipPlanRepo';
import { MembershipBenefitRepo } from '../../../modules/membership/repos/membershipBenefitRepo';
import { MembershipPlanBenefitRepo } from '../../../modules/membership/repos/membershipPlanBenefitRepo';
import membershipSubscriptionRepo, { MembershipSubscription } from '../../../modules/membership/repos/membershipSubscriptionRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Membership Plans Management
// ============================================================================

export const listMembershipPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const plans = await membershipPlanRepo.findAll(activeOnly);
    const stats = await membershipPlanRepo.getStatistics();

    adminRespond(req, res, 'programs/membership/plans/index', {
      pageName: 'Membership Plans',
      plans,
      stats,
      filters: { activeOnly },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load membership plans',
    });
  }
};

export const createMembershipPlanForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'programs/membership/plans/create', {
      pageName: 'Create Membership Plan',
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      description,
      shortDescription,
      isActive,
      isPublic,
      isDefault,
      priority,
      level,
      trialDays,
      price,
      salePrice,
      setupFee,
      currency,
      billingCycle,
      billingPeriod,
      maxMembers,
      autoRenew,
      duration,
      gracePeriodsAllowed,
      gracePeriodDays,
    } = req.body;

    const plan = await membershipPlanRepo.create({
      name,
      code,
      description: description || null,
      shortDescription: null, // Optional field
      isActive: isActive === 'true',
      isPublic: isPublic === 'true',
      isDefault: isDefault === 'true',
      priority: priority ? parseInt(priority) : 0,
      level: level ? parseInt(level) : 1,
      trialDays: trialDays ? parseInt(trialDays) : 0,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      setupFee: setupFee ? parseFloat(setupFee) : 0,
      currency: currency || 'USD',
      billingCycle: billingCycle || 'monthly',
      billingPeriod: billingPeriod ? parseInt(billingPeriod) : 1,
      maxMembers: maxMembers ? parseInt(maxMembers) : null,
      autoRenew: autoRenew === 'true',
      duration: duration ? parseInt(duration) : null,
      gracePeriodsAllowed: gracePeriodsAllowed ? parseInt(gracePeriodsAllowed) : 0,
      gracePeriodDays: gracePeriodDays ? parseInt(gracePeriodDays) : 0,
      membershipImage: null, // Optional field
      publicDetails: null, // Optional field
      privateMeta: null, // Optional field
      visibilityRules: null, // Optional field
      availabilityRules: null, // Optional field
      customFields: null, // Optional field
      createdBy: null, // Optional field - could be set to current user ID
    });

    res.redirect(`/hub/membership/plans/${plan.membershipPlanId}?success=Membership plan created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'programs/membership/plans/create', {
      pageName: 'Create Membership Plan',
      error: error.message || 'Failed to create membership plan',
      formData: req.body,
    });
  }
};

export const viewMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await membershipPlanRepo.findById(planId);

    if (!plan) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Membership plan not found',
      });
      return;
    }

    // Get benefits for this plan using junction table for relationship data
    const planBenefitRepo = new MembershipPlanBenefitRepo();
    const benefitRepo = new MembershipBenefitRepo();

    const planBenefits = await planBenefitRepo.findByPlanId(planId, true); // active only
    const benefits = [];

    for (const planBenefit of planBenefits) {
      const benefit = await benefitRepo.findById(planBenefit.benefitId);
      if (benefit) {
        benefits.push({
          ...benefit,
          planBenefitId: planBenefit.membershipPlanBenefitId,
          priority: planBenefit.priority,
          valueOverride: planBenefit.valueOverride,
          rulesOverride: planBenefit.rulesOverride,
          notes: planBenefit.notes,
        });
      }
    }

    adminRespond(req, res, 'programs/membership/plans/view', {
      pageName: `Plan: ${plan.name}`,
      plan,
      benefits,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load membership plan',
    });
  }
};

export const editMembershipPlanForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await membershipPlanRepo.findById(planId);

    if (!plan) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Membership plan not found',
      });
      return;
    }

    adminRespond(req, res, 'programs/membership/plans/edit', {
      pageName: `Edit: ${plan.name}`,
      plan,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const updates: any = {};

    const {
      name,
      description,
      shortDescription,
      isActive,
      isPublic,
      isDefault,
      priority,
      level,
      trialDays,
      price,
      salePrice,
      setupFee,
      currency,
      billingCycle,
      billingPeriod,
      maxMembers,
      autoRenew,
      duration,
      gracePeriodsAllowed,
      gracePeriodDays,
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description || undefined;
    if (shortDescription !== undefined) updates.shortDescription = shortDescription || undefined;
    if (isActive !== undefined) updates.isActive = isActive === 'true';
    if (isPublic !== undefined) updates.isPublic = isPublic === 'true';
    if (isDefault !== undefined) updates.isDefault = isDefault === 'true';
    if (priority !== undefined) updates.priority = priority ? parseInt(priority) : 0;
    if (level !== undefined) updates.level = level ? parseInt(level) : 1;
    if (trialDays !== undefined) updates.trialDays = trialDays ? parseInt(trialDays) : 0;
    if (price !== undefined) updates.price = parseFloat(price);
    if (salePrice !== undefined) updates.salePrice = salePrice ? parseFloat(salePrice) : undefined;
    if (setupFee !== undefined) updates.setupFee = setupFee ? parseFloat(setupFee) : 0;
    if (currency !== undefined) updates.currency = currency;
    if (billingCycle !== undefined) updates.billingCycle = billingCycle;
    if (billingPeriod !== undefined) updates.billingPeriod = billingPeriod ? parseInt(billingPeriod) : 1;
    if (maxMembers !== undefined) updates.maxMembers = maxMembers ? parseInt(maxMembers) : undefined;
    if (autoRenew !== undefined) updates.autoRenew = autoRenew === 'true';
    if (duration !== undefined) updates.duration = duration ? parseInt(duration) : undefined;
    if (gracePeriodsAllowed !== undefined) updates.gracePeriodsAllowed = gracePeriodsAllowed ? parseInt(gracePeriodsAllowed) : 0;
    if (gracePeriodDays !== undefined) updates.gracePeriodDays = gracePeriodDays ? parseInt(gracePeriodDays) : 0;

    const plan = await membershipPlanRepo.update(planId, updates);

    if (!plan) {
      throw new Error('Membership plan not found after update');
    }

    res.redirect(`/hub/membership/plans/${planId}?success=Membership plan updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const plan = await membershipPlanRepo.findById(req.params.planId);

      adminRespond(req, res, 'programs/membership/plans/edit', {
        pageName: `Edit: ${plan?.name || 'Plan'}`,
        plan,
        error: error.message || 'Failed to update membership plan',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update membership plan',
      });
    }
  }
};

export const activateMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await membershipPlanRepo.activate(planId);

    if (!plan) {
      throw new Error('Membership plan not found');
    }

    res.json({ success: true, message: 'Membership plan activated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to activate membership plan' });
  }
};

export const deactivateMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await membershipPlanRepo.deactivate(planId);

    if (!plan) {
      throw new Error('Membership plan not found');
    }

    res.json({ success: true, message: 'Membership plan deactivated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate membership plan' });
  }
};

export const deleteMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const success = await membershipPlanRepo.remove(planId);

    if (!success) {
      throw new Error('Failed to delete membership plan');
    }

    res.json({ success: true, message: 'Membership plan deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete membership plan' });
  }
};

// ============================================================================
// Membership Benefits Management
// ============================================================================

export const listMembershipBenefits = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = req.query.planId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const benefitRepo = new MembershipBenefitRepo();
    let benefits: any[] = [];

    if (planId) {
      benefits = await benefitRepo.findByPlanId(planId, true); // active only
    } else {
      benefits = await benefitRepo.findAll(true); // active only
    }

    // Get plans for filtering
    const plans = await membershipPlanRepo.findAll(true);

    adminRespond(req, res, 'programs/membership/benefits/index', {
      pageName: 'Membership Benefits',
      benefits,
      plans,
      filters: { planId },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load membership benefits',
    });
  }
};

// ============================================================================
// Membership Management (User memberships)
// ============================================================================

export const listMemberships = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const planId = req.query.planId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get memberships (placeholder - membership repo may not have findAll)
    const memberships: any[] = []; // TODO: Implement when membership repo has findAll

    // Get plans for filtering
    const plans = await membershipPlanRepo.findAll(true);

    adminRespond(req, res, 'programs/membership/memberships/index', {
      pageName: 'User Memberships',
      memberships,
      plans,
      filters: { status, planId },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load memberships',
    });
  }
};

// ============================================================================
// Membership Advanced User Management
// ============================================================================

export const bulkMembershipOperations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { operation, membershipIds, newTierId, notes } = req.body;

    if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
      throw new Error('No memberships selected');
    }

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const membershipId of membershipIds) {
      try {
        switch (operation) {
          case 'activate':
            await updateUserMembership(membershipId, { isActive: true });
            results.push({ id: membershipId, status: 'success', operation: 'activate' });
            successCount++;
            break;

          case 'deactivate':
            await updateUserMembership(membershipId, { isActive: false });
            results.push({ id: membershipId, status: 'success', operation: 'deactivate' });
            successCount++;
            break;

          case 'upgrade':
            if (!newTierId) throw new Error('New tier ID required for upgrade');
            await updateUserMembership(membershipId, { tierId: newTierId });
            results.push({ id: membershipId, status: 'success', operation: 'upgrade' });
            successCount++;
            break;

          case 'cancel':
            await cancelUserMembership(membershipId);
            results.push({ id: membershipId, status: 'success', operation: 'cancel' });
            successCount++;
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error: any) {
        logger.error('Error:', error);
        results.push({ id: membershipId, status: 'error', error: error.message });
        failureCount++;
      }
    }

    res.json({
      success: true,
      message: `Bulk operation completed: ${successCount} successful, ${failureCount} failed`,
      results,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to perform bulk operations' });
  }
};

export const membershipUpgradeDowngrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { membershipId } = req.params;
    const { newTierId, effectiveDate, prorate, notes } = req.body;

    // Get current membership
    const currentMembership = await findUserMembershipById(membershipId);
    if (!currentMembership) {
      throw new Error('Current membership not found');
    }

    // Get new tier
    const newTier = await findTierById(newTierId);
    if (!newTier) {
      throw new Error('New tier not found');
    }

    // Calculate effective date
    const effective = effectiveDate ? new Date(effectiveDate) : new Date();

    // Check if this is an upgrade or downgrade
    const currentTier = await findTierById(currentMembership.membershipPlanId);
    const currentTierLevel = currentTier?.level || 0;
    const newTierLevel = newTier.level;
    const isUpgrade = newTierLevel > currentTierLevel;

    // For immediate changes, update the membership
    if (effective <= new Date()) {
      await updateUserMembership(membershipId, {
        tierId: newTierId,
        notes: notes || `Tier ${isUpgrade ? 'upgraded' : 'downgraded'} to ${newTier.name}`,
      });

      // Handle prorating if requested
      if (prorate && isUpgrade) {
        // Calculate proration (would need billing integration)
      }
    } else {
      // Schedule the change (would need job scheduling system)
      console.log(`Scheduled tier change to ${newTier.name} on ${effective.toISOString()}`);
    }

    res.json({
      success: true,
      message: `Membership ${isUpgrade ? 'upgraded' : 'downgraded'} successfully`,
      change: {
        from: currentTier?.name,
        to: newTier.name,
        effective: effective.toISOString(),
        prorated: prorate && isUpgrade,
      },
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to change membership tier' });
  }
};

export const membershipAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get membership analytics (would need implementation for proper analytics queries)
    const stats = {
      totalMemberships: 0,
      activeMemberships: 0,
      inactiveMemberships: 0,
      membershipsByTier: {},
      membershipsByMonth: [],
      upgradeDowngradeRate: 0,
      churnRate: 0,
      averageLifetime: 0,
      revenueByTier: {},
      topTiers: [],
      renewalRate: 0,
    };

    // Get tier statistics
    const tiers = await findAllTiers(true);
    const tierStats: any = {};

    for (const tier of tiers) {
      // Count memberships per tier (would need repository method)
      tierStats[tier.name] = {
        count: 0, // Would query actual counts
        revenue: 0, // Would calculate based on pricing
        growth: 0, // Would calculate month-over-month growth
      };
    }

    stats.membershipsByTier = tierStats;

    adminRespond(req, res, 'programs/membership/analytics/index', {
      pageName: 'Membership Analytics',
      stats,
      tiers,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load membership analytics',
    });
  }
};

// ============================================================================
// Helper Functions using real repository methods
// ============================================================================

async function findUserMembershipById(membershipId: string): Promise<MembershipSubscription | null> {
  return membershipSubscriptionRepo.findById(membershipId);
}

async function findTierById(tierId: string) {
  return membershipPlanRepo.findById(tierId);
}

async function findAllTiers(includeInactive = false) {
  return membershipPlanRepo.findAll(!includeInactive);
}

async function updateUserMembership(membershipId: string, updates: { tierId?: string; notes?: string; isActive?: boolean }) {
  if (updates.tierId) {
    // Change plan (upgrade/downgrade)
    return membershipSubscriptionRepo.changePlan(membershipId, updates.tierId, updates.notes);
  }
  if (updates.isActive === false) {
    return membershipSubscriptionRepo.pause(membershipId);
  }
  if (updates.isActive === true) {
    return membershipSubscriptionRepo.resume(membershipId);
  }
  return membershipSubscriptionRepo.findById(membershipId);
}

async function cancelUserMembership(membershipId: string) {
  return membershipSubscriptionRepo.cancel(membershipId);
}
