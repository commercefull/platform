/**
 * Consolidated Membership Subscription Repository
 *
 * Merges membershipRepo, membershipSubscriptionRepo, membershipPaymentRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Membership Subscription (user memberships, subscriptions, payments)
 */

import { MembershipRepo } from './membershipRepo';
import membershipSubscriptionRepo from './membershipSubscriptionRepo';
import membershipPaymentRepo from './membershipPaymentRepo';

// Re-export types for backward compatibility
export type { MembershipTier, LegacyMembershipBenefit, UserMembership, UserMembershipWithTier } from './membershipRepo';
export type { MembershipSubscription } from './membershipSubscriptionRepo';

const membershipRepoInstance = new MembershipRepo();

class MembershipSubscriptionDataRepository {
  readonly memberships = membershipRepoInstance;
  readonly subscriptions = membershipSubscriptionRepo;
  readonly payments = membershipPaymentRepo;
}

export default new MembershipSubscriptionDataRepository();
