export const couponTypeDefs = `#graphql
  type CouponDetail {
    couponId: String!
    code: String!
    name: String!
    type: String!
    value: Float!
    discountAmount: Float!
  }

  type CouponValidationResult {
    valid: Boolean!
    coupon: CouponDetail
    error: String
    applicableItems: [CouponApplicableItem!]
  }

  type CouponApplicableItem {
    productId: String!
    discountAmount: Float!
  }

  type ApplyCouponResult {
    applied: Boolean!
    discountAmount: Float!
    discountType: String!
    message: String
    newTotal: Float!
  }

  type RedeemCouponResult {
    redeemed: Boolean!
    redemptionId: String!
    couponId: String!
    redeemedAt: String!
  }

  type CreateCouponResult {
    couponId: String!
    code: String!
    name: String!
    type: String!
    value: Float!
  }

  input CreateCouponInput {
    code: String!
    name: String!
    type: String!
    value: Float!
    createdBy: String!
    description: String
    currency: String
    minOrderValue: Float
    maxDiscountAmount: Float
    usageType: String
    usageLimit: Int
    customerUsageLimit: Int
    startsAt: String
    expiresAt: String
    applicableProducts: [String!]
    applicableCategories: [String!]
  }

  input ApplyCouponInput {
    couponCode: String!
    basketId: String!
    customerId: String
    orderTotal: Float!
  }

  input RedeemCouponInput {
    couponCode: String!
    orderId: String!
    customerId: String
    discountAmount: Float!
  }

  type Query {
    validateCoupon(code: String!, orderValue: Float!, customerId: String): CouponValidationResult!
  }

  type Mutation {
    createCoupon(input: CreateCouponInput!): CreateCouponResult!
    applyCouponCode(input: ApplyCouponInput!): ApplyCouponResult!
    redeemCoupon(input: RedeemCouponInput!): RedeemCouponResult!
  }
`;
