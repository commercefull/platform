/**
 * Membership Controller
 * Handles membership plans, tiers, and benefits management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageMembershipPlansUseCase, ManageMembershipBenefitsUseCase, ManageMembershipSubscriptionsUseCase } from '../../../modules/membership/application/useCases/ManageMembership';
import { adminRespond } from '../../respond';

const managePlansUseCase = new ManageMembershipPlansUseCase();
const manageBenefitsUseCase = new ManageMembershipBenefitsUseCase();
const manageSubscriptionsUseCase = new ManageMembershipSubscriptionsUseCase();

// ============================================================================
// Membership Plans Management
// ============================================================================

export const listMembershipPlans = async (req: TypedRequest, res: Response): Promise<void> => {
  const activeOnly = req.query.activeOnly !== 'false';
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const plans = await managePlansUseCase.findAll(activeOnly);
  const stats = await managePlansUseCase.getStatistics();

  adminRespond(req, res, 'programs/membership/plans/index', {
    pageName: 'Membership Plans',
    plans,
    stats,
    filters: { activeOnly },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

export const createMembershipPlanForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'programs/membership/plans/create', {
    pageName: 'Create Membership Plan',
  });
  
};

export const createMembershipPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      name,
      code,
      description,
      _shortDescription,
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
    } = body;

    const plan = await managePlansUseCase.create({
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
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'programs/membership/plans/create', {
      pageName: 'Create Membership Plan',
      error: (error as Error).message || 'Failed to create membership plan',
      formData: req.body as RequestBody,
    });
  }
};

export const viewMembershipPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  const plan = await managePlansUseCase.findById(planId);

  if (!plan) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Membership plan not found',
    });
    return;
  }

  // Get benefits for this plan using junction table for relationship data
  const planBenefits = await manageBenefitsUseCase.findPlanBenefits(planId, true); // active only
  const benefits = [];

  for (const planBenefit of planBenefits) {
    const benefit = await manageBenefitsUseCase.findById(planBenefit.benefitId);
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
  
};

export const editMembershipPlanForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  const plan = await managePlansUseCase.findById(planId);

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
  
};

export const updateMembershipPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
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
  } = body;

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

  const plan = await managePlansUseCase.update(planId, updates);

  if (!plan) {
    throw new Error('Membership plan not found after update');
  }

  res.redirect(`/hub/membership/plans/${planId}?success=Membership plan updated successfully`);
  
};

export const activateMembershipPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  const plan = await managePlansUseCase.activate(planId);

  if (!plan) {
    throw new Error('Membership plan not found');
  }

  res.json({ success: true, message: 'Membership plan activated successfully' });
  
};

export const deactivateMembershipPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  const plan = await managePlansUseCase.deactivate(planId);

  if (!plan) {
    throw new Error('Membership plan not found');
  }

  res.json({ success: true, message: 'Membership plan deactivated successfully' });
  
};

export const deleteMembershipPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  const success = await managePlansUseCase.remove(planId);

  if (!success) {
    throw new Error('Failed to delete membership plan');
  }

  res.json({ success: true, message: 'Membership plan deleted successfully' });
  
};

// ============================================================================
// Membership Benefits Management
// ============================================================================

export const listMembershipBenefits = async (req: TypedRequest, res: Response): Promise<void> => {
  const planId = req.query.planId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  let benefits: unknown[];

  if (planId) {
    benefits = await manageBenefitsUseCase.findByPlanId(planId, true); // active only
  } else {
    benefits = await manageBenefitsUseCase.findAll(true); // active only
  }

  // Get plans for filtering
  const plans = await managePlansUseCase.findAll(true);

  adminRespond(req, res, 'programs/membership/benefits/index', {
    pageName: 'Membership Benefits',
    benefits,
    plans,
    filters: { planId },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Membership Management (User memberships)
// ============================================================================

export const listMemberships = async (req: TypedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const planId = req.query.planId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // Get memberships (placeholder - membership repo may not have findAll)
  const memberships: unknown[] = []; // TODO: Implement when membership repo has findAll

  // Get plans for filtering
  const plans = await managePlansUseCase.findAll(true);

  adminRespond(req, res, 'programs/membership/memberships/index', {
    pageName: 'User Memberships',
    memberships,
    plans,
    filters: { status, planId },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Membership Advanced User Management
// ============================================================================

export const bulkMembershipOperations = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { operation, membershipIds, newTierId, _notes } = body;

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
    } catch (error: unknown) {
      logger.warn('Error:', error);
      results.push({ id: membershipId, status: 'error', error: (error as Error).message });
      failureCount++;
    }
  }

  res.json({
    success: true,
    message: `Bulk operation completed: ${successCount} successful, ${failureCount} failed`,
    results,
  });
  
};

export const membershipUpgradeDowngrade = async (req: TypedRequest, res: Response): Promise<void> => {
  const { membershipId } = req.params;
  const body = req.body as RequestBody;
  const { newTierId, effectiveDate, prorate, notes } = body;

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
    logger.info('Scheduled tier change', { tierName: newTier.name, effectiveDate: effective.toISOString() });
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
  
};

export const membershipAnalytics = async (req: TypedRequest, res: Response): Promise<void> => {
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
  const tierStats: Record<string, unknown> = {};

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
  
};

// ============================================================================
// Helper Functions using real repository methods
// ============================================================================

async function findUserMembershipById(membershipId: string) {
  return manageSubscriptionsUseCase.findById(membershipId);
}

async function findTierById(tierId: string) {
  return managePlansUseCase.findById(tierId);
}

async function findAllTiers(includeInactive = false) {
  return managePlansUseCase.findAll(!includeInactive);
}

async function updateUserMembership(membershipId: string, updates: { tierId?: string; notes?: string; isActive?: boolean }) {
  if (updates.tierId) {
    return manageSubscriptionsUseCase.changePlan(membershipId, updates.tierId, updates.notes);
  }
  if (updates.isActive === false) {
    return manageSubscriptionsUseCase.pause(membershipId);
  }
  if (updates.isActive === true) {
    return manageSubscriptionsUseCase.resume(membershipId);
  }
  return manageSubscriptionsUseCase.findById(membershipId);
}

async function cancelUserMembership(membershipId: string) {
  return manageSubscriptionsUseCase.cancel(membershipId);
}
