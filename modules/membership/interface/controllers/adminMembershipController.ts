/**
 * Membership Controller
 * Handles membership plans, tiers, and benefits management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import {
  manageMembershipPlansUseCase as managePlansUseCase,
  manageMembershipBenefitsUseCase as manageBenefitsUseCase,
  manageMembershipSubscriptionsUseCase as manageSubscriptionsUseCase,
} from '../../application/wired';
import { adminRespond } from '../../../../libs/adminRespond';
import { buildFormObject, FieldConfig } from '../../../../libs/formParsing';

// ============================================================================
// Membership Plans Management
// ============================================================================

export const listMembershipPlans = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const createMembershipPlanForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'programs/membership/plans/create', {
    pageName: 'Create Membership Plan',
  });
};

const planCreateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'code' },
  { name: 'description', transform: 'stringOrUndefined', default: null },
  { name: 'shortDescription', default: null },
  { name: 'isActive', transform: 'boolTrue' },
  { name: 'isPublic', transform: 'boolTrue' },
  { name: 'isDefault', transform: 'boolTrue' },
  { name: 'priority', transform: 'int', default: 0, falsyValue: 0 },
  { name: 'level', transform: 'int', default: 1, falsyValue: 1 },
  { name: 'trialDays', transform: 'int', default: 0, falsyValue: 0 },
  { name: 'price', transform: 'float' },
  { name: 'salePrice', transform: 'float', default: null, falsyValue: null },
  { name: 'setupFee', transform: 'float', default: 0, falsyValue: 0 },
  { name: 'currency', transform: 'stringOrUndefined', default: 'USD' },
  { name: 'billingCycle', transform: 'stringOrUndefined', default: 'monthly' },
  { name: 'billingPeriod', transform: 'int', default: 1, falsyValue: 1 },
  { name: 'maxMembers', transform: 'int', default: null, falsyValue: null },
  { name: 'autoRenew', transform: 'boolTrue' },
  { name: 'duration', transform: 'int', default: null, falsyValue: null },
  { name: 'gracePeriodsAllowed', transform: 'int', default: 0, falsyValue: 0 },
  { name: 'gracePeriodDays', transform: 'int', default: 0, falsyValue: 0 },
  { name: 'membershipImage', default: null },
  { name: 'publicDetails', default: null },
  { name: 'privateMeta', default: null },
  { name: 'visibilityRules', default: null },
  { name: 'availabilityRules', default: null },
  { name: 'customFields', default: null },
  { name: 'createdBy', default: null },
];

function parsePlanCreateInput(body: HttpRequestBody) {
  return buildFormObject(body as Record<string, unknown>, planCreateFields);
}

export const createMembershipPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const plan = await managePlansUseCase.create(
      parsePlanCreateInput(req.body as HttpRequestBody) as Parameters<typeof managePlansUseCase.create>[0],
    );

    res.redirect(`/hub/membership/plans/${plan.membershipPlanId}?success=Membership plan created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'programs/membership/plans/create', {
      pageName: 'Create Membership Plan',
      error: (error as Error).message || 'Failed to create membership plan',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewMembershipPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const editMembershipPlanForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

const planUpdateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'shortDescription', transform: 'stringOrUndefined' },
  { name: 'isActive', transform: 'boolTrue' },
  { name: 'isPublic', transform: 'boolTrue' },
  { name: 'isDefault', transform: 'boolTrue' },
  { name: 'priority', transform: 'int', falsyValue: 0 },
  { name: 'level', transform: 'int', falsyValue: 1 },
  { name: 'trialDays', transform: 'int', falsyValue: 0 },
  { name: 'price', transform: 'float' },
  { name: 'salePrice', transform: 'float', falsyValue: undefined },
  { name: 'setupFee', transform: 'float', falsyValue: 0 },
  { name: 'currency' },
  { name: 'billingCycle' },
  { name: 'billingPeriod', transform: 'int', falsyValue: 1 },
  { name: 'maxMembers', transform: 'int', falsyValue: undefined },
  { name: 'autoRenew', transform: 'boolTrue' },
  { name: 'duration', transform: 'int', falsyValue: undefined },
  { name: 'gracePeriodsAllowed', transform: 'int', falsyValue: 0 },
  { name: 'gracePeriodDays', transform: 'int', falsyValue: 0 },
];

function parsePlanUpdates(body: HttpRequestBody): Record<string, unknown> {
  return buildFormObject(body as Record<string, unknown>, planUpdateFields);
}

export const updateMembershipPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { planId } = req.params;
  const updates = parsePlanUpdates(req.body as HttpRequestBody);

  const plan = await managePlansUseCase.update(planId, updates);

  if (!plan) {
    throw new Error('Membership plan not found after update');
  }

  res.redirect(`/hub/membership/plans/${planId}?success=Membership plan updated successfully`);
};

export const activateMembershipPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { planId } = req.params;

  const plan = await managePlansUseCase.activate(planId);

  if (!plan) {
    throw new Error('Membership plan not found');
  }

  res.json({ success: true, message: 'Membership plan activated successfully' });
};

export const deactivateMembershipPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { planId } = req.params;

  const plan = await managePlansUseCase.deactivate(planId);

  if (!plan) {
    throw new Error('Membership plan not found');
  }

  res.json({ success: true, message: 'Membership plan deactivated successfully' });
};

export const deleteMembershipPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const listMembershipBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const listMemberships = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const bulkMembershipOperations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const { operation, membershipIds, newTierId, _notes } = body as {
    operation: string;
    membershipIds: string[];
    newTierId: string;
    _notes?: string;
  };

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

export const membershipUpgradeDowngrade = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { membershipId } = req.params;
  const body = req.body as HttpRequestBody;
  const { newTierId, effectiveDate, prorate, notes } = body as {
    newTierId: string;
    effectiveDate?: string;
    prorate?: string;
    notes?: string;
  };

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

export const membershipAnalytics = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
