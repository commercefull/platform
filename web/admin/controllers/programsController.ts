/**
 * Programs Controller for Admin Hub
 * Dashboard views for Membership, Subscription, Loyalty, and B2B programs
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as adminProgramsRepo from '../../../modules/membership/infrastructure/repositories/adminProgramsRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Membership Dashboard
// ============================================================================

export const membershipDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminProgramsRepo.getMembershipStats();
    const tiers = await adminProgramsRepo.findMembershipTiersWithCounts();
    const members = await adminProgramsRepo.findRecentMemberships(20);

    adminRespond(req, res, 'programs/membership/index', {
      pageName: 'Membership Program',
      stats,
      tiers,
      members,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load membership dashboard',
    });
  }
};

// ============================================================================
// Subscription Dashboard
// ============================================================================

export const subscriptionDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminProgramsRepo.getSubscriptionStats();
    const plans = await adminProgramsRepo.findSubscriptionPlansWithCounts();
    const subscriptions = await adminProgramsRepo.findRecentSubscriptions(20);

    adminRespond(req, res, 'programs/subscription/index', {
      pageName: 'Subscription Management',
      stats: {
        totalSubscriptions: stats.totalSubscriptions,
        activeSubscriptions: stats.activeSubscriptions,
        mrr: stats.mrr,
        churnRate: 0,
      },
      plans,
      subscriptions,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load subscription dashboard',
    });
  }
};

// ============================================================================
// Loyalty Dashboard
// ============================================================================

export const loyaltyDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminProgramsRepo.getLoyaltyStats();
    const rewards = await adminProgramsRepo.findLoyaltyRewardsWithCounts();
    const transactions = await adminProgramsRepo.findRecentLoyaltyTransactions(20);

    const settings = {
      pointsPerDollar: 1,
      pointValue: 0.01,
      minRedemption: 100,
    };

    adminRespond(req, res, 'programs/loyalty/index', {
      pageName: 'Loyalty Program',
      stats,
      rewards,
      transactions,
      settings,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load loyalty dashboard',
    });
  }
};
