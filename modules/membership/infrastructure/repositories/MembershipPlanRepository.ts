/**
 * Consolidated Membership Plan Repository
 *
 * Merges membershipPlanRepo, membershipBenefitRepo, membershipPlanBenefitRepo,
 * adminProgramsRepo, storefrontMembershipRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Membership Plan (plans, benefits, plan-benefit mappings, admin programs, storefront)
 */

import * as membershipPlanRepo from './membershipPlanRepo';
import membershipBenefitRepo from './membershipBenefitRepo';
import membershipPlanBenefitRepo from './membershipPlanBenefitRepo';
import * as adminProgramsRepo from './adminProgramsRepo';
import * as storefrontMembershipRepo from './storefrontMembershipRepo';

// Re-export types for backward compatibility
export type { MembershipPlan, BillingCycle } from './membershipPlanRepo';
export type { MembershipBenefit } from './membershipBenefitRepo';
export type { MembershipPlanBenefit } from './membershipPlanBenefitRepo';

class MembershipPlanRepository {
  readonly plans = membershipPlanRepo;
  readonly benefits = membershipBenefitRepo;
  readonly planBenefits = membershipPlanBenefitRepo;
  readonly admin = adminProgramsRepo;
  readonly storefront = storefrontMembershipRepo;
}

export default new MembershipPlanRepository();
