export const fulfillmentTypeDefs = `#graphql
  type FulfillmentItem {
    fulfillmentItemId: String!
    fulfillmentId: String!
    orderItemId: String!
    productId: String!
    variantId: String
    sku: String!
    name: String!
    quantityOrdered: Int!
    quantityFulfilled: Int!
    warehouseLocation: String
    binLocation: String
  }

  type Fulfillment {
    fulfillmentId: String!
    orderId: String!
    orderNumber: String
    sourceType: String!
    sourceId: String!
    organizationId: String
    supplierId: String
    storeId: String
    channelId: String
    status: String!
    carrierId: String
    carrierName: String
    trackingNumber: String
    trackingUrl: String
    shippingMethodId: String
    shippingMethodName: String
    fulfillmentPartnerId: String
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type GetFulfillmentResult {
    fulfillment: Fulfillment
    items: [FulfillmentItem!]!
  }

  type CreateFulfillmentResult {
    fulfillment: Fulfillment!
    items: [FulfillmentItem!]!
  }

  type ShipOrderResult {
    fulfillment: Fulfillment!
  }

  type MarkDeliveredResult {
    fulfillment: Fulfillment!
  }

  type CancelFulfillmentResult {
    fulfillment: Fulfillment!
  }

  type UpdateTrackingResult {
    fulfillment: Fulfillment!
  }

  input FulfillmentItemInput {
    orderItemId: String!
    productId: String!
    variantId: String
    sku: String!
    name: String!
    quantityOrdered: Int!
    warehouseLocation: String
    binLocation: String
  }

  input AddressInput {
    name: String!
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    phone: String
  }

  input CreateFulfillmentInput {
    orderId: String!
    orderNumber: String
    sourceType: String!
    sourceId: String!
    organizationId: String
    supplierId: String
    storeId: String
    channelId: String
    shipFromAddress: AddressInput!
    shipToAddress: AddressInput!
    carrierId: String
    carrierName: String
    shippingMethodId: String
    shippingMethodName: String
    fulfillmentPartnerId: String
    items: [FulfillmentItemInput!]!
    notes: String
  }

  type Query {
    fulfillment(fulfillmentId: String, trackingNumber: String): GetFulfillmentResult!
  }

  type Mutation {
    createFulfillment(input: CreateFulfillmentInput!): CreateFulfillmentResult!
    shipOrder(
      fulfillmentId: String!
      trackingNumber: String!
      trackingUrl: String
      carrierId: String
      carrierName: String
      shippingCost: Float
    ): ShipOrderResult!
    markDelivered(fulfillmentId: String!): MarkDeliveredResult!
    cancelFulfillment(fulfillmentId: String!, reason: String): CancelFulfillmentResult!
    updateTracking(
      fulfillmentId: String!
      trackingNumber: String!
      trackingUrl: String
    ): UpdateTrackingResult!
  }
`;
