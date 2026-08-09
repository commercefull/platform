export const pricingTypeDefs = `#graphql
  type PriceBreakdown {
    basePrice: Float!
    salePrice: Float
    volumeDiscount: Float
    customerDiscount: Float
    finalPrice: Float!
    currency: String!
    appliedRules: [String!]!
  }

  type CalculatePriceResult {
    unitPrice: Float!
    totalPrice: Float!
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
    price: Float!
    salePrice: Float
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
    price: Float!
    salePrice: Float
    saleStartDate: String
    saleEndDate: String
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
