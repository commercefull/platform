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
import { ManageUserMembershipsUseCase } from './useCases/ManageUserMemberships';
import { ManageMembershipTiersUseCase } from './useCases/ManageMembershipTiers';
import { ManageTierBenefitsUseCase } from './useCases/ManageTierBenefits';

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
  membershipPlanRepository.plans,
);
export const manageMembershipProgramsUseCase = new ManageMembershipProgramsUseCase(membershipPlanRepository.admin);
export const manageStorefrontMembershipUseCase = new ManageStorefrontMembershipUseCase(
  membershipPlanRepository.storefront,
);
export const manageUserMembershipsUseCase = new ManageUserMembershipsUseCase(membershipSubscriptionDataRepository.memberships);
export const manageMembershipTiersUseCase = new ManageMembershipTiersUseCase(membershipSubscriptionDataRepository.memberships);
export const manageTierBenefitsUseCase = new ManageTierBenefitsUseCase(membershipSubscriptionDataRepository.memberships);

import { GetMembershipBenefitsUseCase } from './useCases/GetMembershipBenefits';
import { AssignMembershipUseCase } from './useCases/AssignMembership';
import { CancelMembershipUseCase } from './useCases/CancelMembership';
import { UpgradeMembershipUseCase } from './useCases/UpgradeMembership';
import { RenewMembershipUseCase } from './useCases/RenewMembership';

export const getMembershipBenefitsUseCase = new GetMembershipBenefitsUseCase(
  membershipSubscriptionDataRepository.memberships as unknown as ConstructorParameters<typeof GetMembershipBenefitsUseCase>[0],
);
export const assignMembershipUseCase = new AssignMembershipUseCase(
  membershipSubscriptionDataRepository.memberships as unknown as ConstructorParameters<typeof AssignMembershipUseCase>[0],
);
export const cancelMembershipUseCase = new CancelMembershipUseCase(
  membershipSubscriptionDataRepository.memberships as unknown as ConstructorParameters<typeof CancelMembershipUseCase>[0],
);
export const upgradeMembershipUseCase = new UpgradeMembershipUseCase(
  membershipSubscriptionDataRepository.memberships as unknown as ConstructorParameters<typeof UpgradeMembershipUseCase>[0],
);
export const renewMembershipUseCase = new RenewMembershipUseCase(
  membershipSubscriptionDataRepository.memberships as unknown as ConstructorParameters<typeof RenewMembershipUseCase>[0],
);
