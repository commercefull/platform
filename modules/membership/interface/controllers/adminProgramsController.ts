/**
 * Programs Controller for Admin Hub
 * Dashboard views for Membership, Subscription, Loyalty, and B2B programs
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageMembershipProgramsUseCase } from '../../application/wired';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Membership Dashboard
// ============================================================================

export const membershipDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stats = await manageMembershipProgramsUseCase.getMembershipStats();
  const tiers = await manageMembershipProgramsUseCase.findMembershipTiersWithCounts();
  const members = await manageMembershipProgramsUseCase.findRecentMemberships(20);

  adminRespond(req, res, 'programs/membership/index', {
    pageName: 'Membership Program',
    stats,
    tiers,
    members,
  });
};

// ============================================================================
// Subscription Dashboard
// ============================================================================

export const subscriptionDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stats = await manageMembershipProgramsUseCase.getSubscriptionStats();
  const plans = await manageMembershipProgramsUseCase.findSubscriptionPlansWithCounts();
  const subscriptions = await manageMembershipProgramsUseCase.findRecentSubscriptions(20);

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
};

// ============================================================================
// Loyalty Dashboard
// ============================================================================

export const loyaltyDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stats = await manageMembershipProgramsUseCase.getLoyaltyStats();
  const rewards = await manageMembershipProgramsUseCase.findLoyaltyRewardsWithCounts();
  const transactions = await manageMembershipProgramsUseCase.findRecentLoyaltyTransactions(20);

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
};
