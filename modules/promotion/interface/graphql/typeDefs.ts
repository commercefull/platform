export const promotionTypeDefs = `#graphql
  type Promotion {
    promotionId: String!
    name: String!
    description: String
    promotionType: String!
    status: String!
    isActive: Boolean!
    startDate: String
    endDate: String
    organizationId: String
    createdAt: String!
    updatedAt: String!
  }

  type PromotionListResult {
    data: [Promotion!]!
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  type GiftCardBalanceResult {
    success: Boolean!
    code: String
    currentBalance: Float
    currency: String
    status: String
    expiresAt: String
    isReloadable: Boolean
    message: String
    errors: [String!]
  }

  type RedeemGiftCardResult {
    success: Boolean!
    remainingBalance: Float
    message: String
    errors: [String!]
  }

  input PromotionFilterInput {
    status: String
    isActive: Boolean
    organizationId: String
  }

  input PromotionPaginationInput {
    limit: Int
    offset: Int
    orderBy: String
    direction: String
  }

  type Query {
    promotions(filters: PromotionFilterInput, pagination: PromotionPaginationInput): PromotionListResult!
    giftCardBalance(code: String!): GiftCardBalanceResult!
  }

  type Mutation {
    redeemGiftCard(
      code: String!
      amount: Float!
      orderId: String
      customerId: String
    ): RedeemGiftCardResult!
  }
`;
