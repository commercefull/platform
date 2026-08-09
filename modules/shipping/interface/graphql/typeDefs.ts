export const shippingTypeDefs = `#graphql
  type ShippingRateOption {
    shippingMethodId: String!
    shippingMethodName: String!
    shippingMethodCode: String!
    shippingCarrierId: String
    rateId: String!
    rateName: String
    rateType: String!
    amount: Float!
    currency: String!
    estimatedDeliveryDays: Int
    isFreeShipping: Boolean!
    taxable: Boolean!
  }

  type CalculateShippingRatesResult {
    success: Boolean!
    rates: [ShippingRateOption!]!
    message: String
    errors: [String!]
  }

  type ShippingMethod {
    shippingMethodId: String!
    name: String!
    code: String!
    shippingCarrierId: String
    isActive: Boolean!
    displayOnFrontend: Boolean!
    estimatedDeliveryDays: Int
    handlingDays: Int
    minOrderValue: Float
    maxOrderValue: Float
    minWeight: Float
    maxWeight: Float
  }

  type ShippingMethodsResult {
    success: Boolean!
    methods: [ShippingMethod!]!
    total: Int!
    message: String
  }

  input ShippingAddressInput {
    country: String!
    state: String
    city: String
    postalCode: String
  }

  input OrderDetailsInput {
    subtotal: Float!
    itemCount: Int!
    totalWeight: Float
    currency: String
  }

  type Query {
    shippingRates(destinationAddress: ShippingAddressInput!, orderDetails: OrderDetailsInput!): CalculateShippingRatesResult!
    shippingMethods(activeOnly: Boolean, displayOnFrontend: Boolean, carrierId: String): ShippingMethodsResult!
  }
`;
