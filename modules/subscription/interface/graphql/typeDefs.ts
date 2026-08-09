export const subscriptionTypeDefs = `#graphql
  type CustomerSubscription {
    customerSubscriptionId: String!
    subscriptionNumber: String
    customerId: String!
    subscriptionPlanId: String!
    status: String!
    quantity: Int!
    currentPeriodStart: String
    currentPeriodEnd: String
    nextBillingDate: String
    trialEnd: String
    pausedAt: String
    cancelledAt: String
    cancelReason: String
    createdAt: String!
    updatedAt: String!
  }

  type CreateSubscriptionResult {
    success: Boolean!
    subscription: CustomerSubscription
    message: String
    errors: [String!]
  }

  type CancelSubscriptionResult {
    success: Boolean!
    subscription: CustomerSubscription
    message: String
    errors: [String!]
  }

  type ChangeSubscriptionPlanResult {
    subscriptionId: String!
    previousPlanId: String!
    newPlanId: String!
    effectiveDate: String!
    proratedAmount: Float
  }

  type PauseSubscriptionResult {
    subscriptionId: String!
    status: String!
    pausedAt: String!
    pauseUntil: String
  }

  type ResumeSubscriptionResult {
    subscriptionId: String!
    status: String!
    resumedAt: String!
    nextBillingDate: String!
  }

  input CreateSubscriptionInput {
    customerId: String!
    subscriptionPlanId: String!
    productVariantId: String
    quantity: Int
    paymentMethodId: String
    shippingAddressId: String
    billingAddressId: String
  }

  input CancelSubscriptionInput {
    customerSubscriptionId: String!
    reason: String
    cancelledBy: String!
    cancelImmediately: Boolean
  }

  type Query {
    subscription(customerSubscriptionId: String!): CustomerSubscription
  }

  type Mutation {
    createSubscription(input: CreateSubscriptionInput!): CreateSubscriptionResult!
    cancelSubscription(input: CancelSubscriptionInput!): CancelSubscriptionResult!
    changeSubscriptionPlan(subscriptionId: String!, newPlanId: String!, applyImmediately: Boolean, prorateCharges: Boolean): ChangeSubscriptionPlanResult!
    pauseSubscription(subscriptionId: String!, reason: String, pauseUntil: String): PauseSubscriptionResult!
    resumeSubscription(subscriptionId: String!): ResumeSubscriptionResult!
  }
`;
