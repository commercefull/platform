export const pricingTypeDefs = `#graphql
  type PriceBreakdown {
    basePriceCents: Int!
    salePriceCents: Int
    volumeDiscountCents: Int
    customerDiscountCents: Int
    finalPriceCents: Int!
    currency: String!
    appliedRules: [String!]!
  }

  type CalculatePriceResult {
    unitPriceCents: Int!
    totalPriceCents: Int!
    currency: String!
    breakdown: PriceBreakdown!
  }

  type CreatePriceListResult {
    priceListId: String!
    name: String!
    type: String!
    currencyCode: String!
    isDefault: Boolean!
    createdAt: String!
  }

  type SetProductPriceResult {
    productId: String!
    variantId: String
    priceCents: Int!
    salePriceCents: Int
    updatedAt: String!
  }

  input CalculatePriceInput {
    productId: String!
    variantId: String
    quantity: Int!
    customerId: String
    channelId: String
    storeId: String
    priceListId: String
  }

  input CreatePriceListInput {
    name: String!
    description: String
    currencyCode: String!
    type: String!
    isDefault: Boolean
    validFrom: String
    validTo: String
    storeIds: [String!]
  }

  input SetProductPriceInput {
    productId: String!
    variantId: String
    priceListId: String
    priceCents: Int!
    salePriceCents: Int
    currencyCode: String
  }

  type Query {
    calculatePrice(input: CalculatePriceInput!): CalculatePriceResult!
  }

  type Mutation {
    createPriceList(input: CreatePriceListInput!): CreatePriceListResult!
    setProductPrice(input: SetProductPriceInput!): SetProductPriceResult!
  }
`;
