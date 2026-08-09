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

  type PointsTransaction {
    transactionId: String!
    type: String!
    points: Int!
    balance: Int!
    description: String!
    referenceType: String
    referenceId: String
    createdAt: String!
    expiresAt: String
  }

  type PointsHistoryResult {
    transactions: [PointsTransaction!]!
    total: Int!
    page: Int!
    limit: Int!
    summary: PointsSummary!
  }

  type PointsSummary {
    totalEarned: Int!
    totalRedeemed: Int!
    totalExpired: Int!
    currentBalance: Int!
  }

  type TierInfo {
    tierId: String!
    tierName: String!
    tierLevel: Int!
    benefits: [String!]!
    pointsMultiplier: Float!
  }

  type TierStatusResult {
    currentTier: TierInfo!
    previousTier: TierInfo
    tierChanged: Boolean!
    changeType: String
    pointsToNextTier: Int
    nextTier: TierInfo
    qualifyingPoints: Int!
    qualifyingPurchases: Int!
  }

  type EarnPointsResult {
    transactionId: String!
    customerId: String!
    pointsEarned: Int!
    newBalance: Int!
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

  type RedeemRewardResult {
    redemptionId: String!
    rewardId: String!
    rewardName: String!
    pointsSpent: Int!
    remainingBalance: Int!
    couponCode: String
    productId: String
    discountValue: Float
    discountType: String
    redeemedAt: String!
    expiresAt: String
  }

  input EarnPointsInput {
    customerId: String!
    orderId: String
    actionType: String!
    amount: Float
    points: Int
    description: String
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
    minOrderValue: Float
    maxUsagePerCustomer: Int
    totalQuantity: Int
    validFrom: String
    validTo: String
    isActive: Boolean
  }

  type Query {
    pointsBalance(customerId: String!): PointsBalance!
    pointsHistory(customerId: String!, page: Int, limit: Int, type: String, startDate: String, endDate: String): PointsHistoryResult!
    tierStatus(customerId: String!, programId: String): TierStatusResult!
  }

  type Mutation {
    earnPoints(input: EarnPointsInput!): EarnPointsResult!
    redeemPoints(input: RedeemPointsInput!): RedeemPointsResult!
    createReward(input: CreateRewardInput!): CreateRewardResult!
    redeemReward(customerId: String!, rewardId: String!, orderId: String): RedeemRewardResult!
  }
`;
