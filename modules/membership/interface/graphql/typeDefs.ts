export const membershipTypeDefs = `#graphql
  type MembershipBenefitItem {
    type: String!
    value: String!
    description: String
  }

  type MembershipBenefitsResult {
    hasMembership: Boolean!
    tierName: String
    tierLevel: Int
    benefits: [MembershipBenefitItem!]!
    expiresAt: String
    daysRemaining: Int
  }

  type AssignMembershipResult {
    membershipId: String!
    customerId: String!
    tierId: String!
    tierName: String!
    status: String!
    startDate: String!
    endDate: String
  }

  type CancelMembershipResult {
    membershipId: String!
    status: String!
    cancelledAt: String!
    effectiveEndDate: String!
    refundEligible: Boolean!
    refundAmount: Float
  }

  type UpgradeMembershipResult {
    membershipId: String!
    previousTierId: String!
    newTierId: String!
    newTierName: String!
    proratedAmount: Float
    newBillingAmount: Float!
    effectiveDate: String!
    nextBillingDate: String!
  }

  type RenewMembershipResult {
    membershipId: String!
    status: String!
    renewedAt: String!
    newPeriodStart: String!
    newPeriodEnd: String!
    amount: Float!
    paymentStatus: String!
  }

  input AssignMembershipInput {
    customerId: String!
    tierId: String!
    paymentMethodId: String
    startDate: String
    source: String
  }

  type Query {
    membershipBenefits(customerId: String!): MembershipBenefitsResult!
  }

  type Mutation {
    assignMembership(input: AssignMembershipInput!): AssignMembershipResult!
    cancelMembership(membershipId: String!, reason: String, feedback: String, immediate: Boolean, cancelledBy: String): CancelMembershipResult!
    upgradeMembership(membershipId: String!, newTierId: String!, prorateBilling: Boolean, effectiveDate: String): UpgradeMembershipResult!
    renewMembership(membershipId: String!, paymentMethodId: String, autoRenew: Boolean): RenewMembershipResult!
  }
`;
