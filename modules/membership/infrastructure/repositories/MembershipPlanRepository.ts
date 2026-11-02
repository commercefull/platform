/**
 * Consolidated Membership Plan Repository
 *
 * Merges membershipPlanRepo, membershipBenefitRepo, membershipPlanBenefitRepo,
 * adminProgramsRepo, storefrontMembershipRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Membership Plan (plans, benefits, plan-benefit mappings, admin programs, storefront)
 */

import {
  findById,
  findAll,
  create,
  update,
  remove,
  getStatistics,
  activate,
  deactivate,
} from './membershipPlanRepo';
import membershipBenefitRepo from './membershipBenefitRepo';
import membershipPlanBenefitRepo from './membershipPlanBenefitRepo';
import {
  getMembershipStats,
  findMembershipTiersWithCounts,
  findRecentMemberships,
  getSubscriptionStats,
  findSubscriptionPlansWithCounts,
  findRecentSubscriptions,
  getLoyaltyStats,
  findLoyaltyRewardsWithCounts,
  findRecentLoyaltyTransactions,
} from './adminProgramsRepo';
import {
  findActivePlansWithBenefitCount,
  findPlanById,
  findBenefitsByPlanId,
  findActiveMembershipWithPlan,
  findActiveMembershipByCustomerId,
  createMembership,
} from './storefrontMembershipRepo';

// Re-export types for backward compatibility
export type { MembershipPlan, BillingCycle } from './membershipPlanRepo';
export type { MembershipBenefit } from './membershipBenefitRepo';
export type { MembershipPlanBenefit } from './membershipPlanBenefitRepo';

const membershipPlanRepo = {
  findById,
  findAll,
  create,
  update,
  remove,
  getStatistics,
  activate,
  deactivate,
};

const adminProgramsRepo = {
  getMembershipStats,
  findMembershipTiersWithCounts,
  findRecentMemberships,
  getSubscriptionStats,
  findSubscriptionPlansWithCounts,
  findRecentSubscriptions,
  getLoyaltyStats,
  findLoyaltyRewardsWithCounts,
  findRecentLoyaltyTransactions,
};

const storefrontMembershipRepo = {
  findActivePlansWithBenefitCount,
  findPlanById,
  findBenefitsByPlanId,
  findActiveMembershipWithPlan,
  findActiveMembershipByCustomerId,
  createMembership,
};

class MembershipPlanRepository {
  readonly plans = membershipPlanRepo;
  readonly benefits = membershipBenefitRepo;
  readonly planBenefits = membershipPlanBenefitRepo;
  readonly admin = adminProgramsRepo;
  readonly storefront = storefrontMembershipRepo;
}

export default new MembershipPlanRepository();
