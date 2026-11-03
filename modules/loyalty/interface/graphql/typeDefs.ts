export const loyaltyTypeDefs = `#graphql
  type PointsBalance {
    customerId: String!
    availablePoints: Int!
    pendingPoints: Int!
    lifetimePoints: Int!
    tierName: String!
    tierMultiplier: Float!
    nextTierName: String
    pointsToNextTier: Int
  }

  type RedeemPointsResult {
    transactionId: String!
    customerId: String!
    pointsRedeemed: Int!
    newBalance: Int!
    discountValue: Float
  }

  type CreateRewardResult {
    rewardId: String!
    name: String!
    pointsCost: Int!
    type: String!
    isActive: Boolean!
    createdAt: String!
  }

  input RedeemPointsInput {
    customerId: String!
    points: Int!
    rewardId: String
    orderId: String
    description: String
  }

  input CreateRewardInput {
    programId: String
    name: String!
    description: String!
    type: String!
    pointsCost: Int!
    value: Float
    valueType: String
    productId: String
    categoryId: String
    minOrderValueCents: Float
    maxUsagePerCustomer: Int
    totalQuantity: Int
    validFrom: String
    validTo: String
    isActive: Boolean
  }

  type Query {
    pointsBalance(customerId: String!): PointsBalance!
  }

  type Mutation {
    redeemPoints(input: RedeemPointsInput!): RedeemPointsResult!
    createReward(input: CreateRewardInput!): CreateRewardResult!
  }
`;
