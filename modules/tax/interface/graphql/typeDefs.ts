export const taxTypeDefs = `#graphql
  type TaxLineItem {
    productId: String!
    name: String!
    subtotal: Float!
    taxAmount: Float!
    taxRate: Float!
  }

  type CalculateOrderTaxResult {
    success: Boolean!
    subtotal: Float!
    shippingAmount: Float!
    taxAmount: Float!
    total: Float!
    taxRate: Float!
    lineItems: [TaxLineItem!]!
    message: String
  }

  type TaxRateResult {
    taxRateId: String!
    name: String!
    rate: Float!
    isCompound: Boolean!
    includesShipping: Boolean!
  }

  type GetTaxRateForAddressResult {
    rates: [TaxRateResult!]!
    combinedRate: Float!
    isExempt: Boolean!
    exemptionReason: String
  }

  type CreateTaxRateResult {
    taxRateId: String!
    name: String!
    rate: Float!
    country: String!
    isActive: Boolean!
    createdAt: String!
  }

  input TaxAddressInput {
    country: String!
    state: String
    city: String
    postalCode: String
  }

  input OrderLineItemInput {
    productId: String!
    name: String!
    quantity: Int!
    unitPrice: Float!
    taxCategoryId: String
    taxable: Boolean
  }

  input CalculateOrderTaxInput {
    items: [OrderLineItemInput!]!
    shippingAddress: TaxAddressInput!
    shippingAmount: Float
    customerId: String
  }

  input CreateTaxRateInput {
    name: String!
    rate: Float!
    type: String
    country: String!
    state: String
    postalCode: String
    city: String
    taxCategory: String
    isCompound: Boolean
    includesShipping: Boolean
    priority: Int
    isActive: Boolean
  }

  input GetTaxRateForAddressInput {
    address: TaxAddressInput!
    taxCategory: String
    customerId: String
  }

  type Query {
    taxRateForAddress(input: GetTaxRateForAddressInput!): GetTaxRateForAddressResult!
  }

  type Mutation {
    calculateOrderTax(input: CalculateOrderTaxInput!): CalculateOrderTaxResult!
    createTaxRate(input: CreateTaxRateInput!): CreateTaxRateResult!
  }
`;
