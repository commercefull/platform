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
    merchantId: String
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

  type ValidateCouponResult {
    valid: Boolean!
    coupon: PromotionCoupon
    discountAmount: Float
    message: String
    errors: [String!]
  }

  type PromotionCoupon {
    promotionCouponId: String!
    code: String!
    isActive: Boolean!
    startDate: String
    endDate: String
    maxUsage: Int
    usageCount: Int!
    minOrderAmount: Float
    maxUsagePerCustomer: Int
  }

  type RedeemCouponResult {
    success: Boolean!
    message: String
    errors: [String!]
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
    merchantId: String
  }

  input PromotionPaginationInput {
    limit: Int
    offset: Int
    orderBy: String
    direction: String
  }

  type Query {
    promotions(filters: PromotionFilterInput, pagination: PromotionPaginationInput): PromotionListResult!
    validateCoupon(code: String!, orderTotal: Float!, customerId: String, merchantId: String): ValidateCouponResult!
    giftCardBalance(code: String!): GiftCardBalanceResult!
  }

  type Mutation {
    redeemCoupon(
      code: String!
      orderId: String!
      orderTotal: Float!
      discountAmount: Float!
      customerId: String
      merchantId: String
    ): RedeemCouponResult!

    redeemGiftCard(
      code: String!
      amount: Float!
      orderId: String
      customerId: String
    ): RedeemGiftCardResult!
  }
`;
