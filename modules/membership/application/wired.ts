import membershipPlanRepository from '../infrastructure/repositories/MembershipPlanRepository';
import membershipSubscriptionDataRepository from '../infrastructure/repositories/MembershipSubscriptionDataRepository';
import type {
  LegacyMembershipBenefit as _MembershipBenefit,
  MembershipSubscription as _MembershipSubscription,
} from '../infrastructure/repositories/MembershipSubscriptionDataRepository';
import { ManageMembershipPlansUseCase } from './useCases/ManageMembershipPlans';
import { ManageMembershipBenefitsUseCase } from './useCases/ManageMembershipBenefits';
import { ManageMembershipSubscriptionsUseCase } from './useCases/ManageMembershipSubscriptions';
import { ManageMembershipProgramsUseCase } from './useCases/ManageMembershipPrograms';
import { ManageStorefrontMembershipUseCase } from './useCases/ManageStorefrontMembership';

export {
  membershipPlanRepository,
  membershipSubscriptionDataRepository,
  _MembershipBenefit as LegacyMembershipBenefit,
  _MembershipSubscription as MembershipSubscription,
};

export const manageMembershipPlansUseCase = new ManageMembershipPlansUseCase(membershipPlanRepository.plans);
export const manageMembershipBenefitsUseCase = new ManageMembershipBenefitsUseCase(
  membershipPlanRepository.benefits,
  membershipPlanRepository.planBenefits,
);
export const manageMembershipSubscriptionsUseCase = new ManageMembershipSubscriptionsUseCase(
  membershipSubscriptionDataRepository.subscriptions,
);
export const manageMembershipProgramsUseCase = new ManageMembershipProgramsUseCase(membershipPlanRepository.admin);
export const manageStorefrontMembershipUseCase = new ManageStorefrontMembershipUseCase(
  membershipPlanRepository.storefront,
);
