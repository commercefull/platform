export const couponTypeDefs = `#graphql
  type CouponDetail {
    couponId: String!
    code: String!
    name: String!
    type: String!
    value: Float!
    discountAmountCents: Int!
  }

  type CouponValidationResult {
    valid: Boolean!
    coupon: CouponDetail
    error: String
    applicableItems: [CouponApplicableItem!]
  }

  type CouponApplicableItem {
    productId: String!
    discountAmountCents: Int!
  }

  type ApplyCouponResult {
    applied: Boolean!
    discountAmountCents: Int!
    discountType: String!
    message: String
    newTotalCents: Int!
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
    minOrderValueCents: Int
    maxDiscountAmountCents: Int
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
    orderTotalCents: Int!
  }

  input RedeemCouponInput {
    couponCode: String!
    orderId: String!
    customerId: String
    discountAmountCents: Int!
  }

  type Query {
    validateCoupon(code: String!, orderValueCents: Int!, customerId: String): CouponValidationResult!
  }

  type Mutation {
    createCoupon(input: CreateCouponInput!): CreateCouponResult!
    applyCouponCode(input: ApplyCouponInput!): ApplyCouponResult!
    redeemCoupon(input: RedeemCouponInput!): RedeemCouponResult!
  }
`;
