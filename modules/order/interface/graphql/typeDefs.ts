export const orderTypeDefs = `#graphql
  type OrderItem {
    orderItemId: String!
    productId: String!
    productVariantId: String
    sku: String!
    name: String!
    description: String
    quantity: Int!
    unitPrice: Float!
    discountedUnitPrice: Float
    lineTotal: Float!
    discountTotal: Float!
    taxTotal: Float!
    fulfillmentStatus: String!
    giftWrapped: Boolean!
    giftMessage: String
    isDigital: Boolean!
  }

  type OrderAddress {
    orderAddressId: String!
    addressType: String!
    firstName: String!
    lastName: String!
    fullName: String!
    company: String
    address1: String!
    address2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    countryCode: String!
    phone: String
    email: String
    fullAddress: String!
  }

  type OrderDetail {
    orderId: String!
    orderNumber: String!
    customerId: String
    basketId: String
    storeId: String
    channelId: String
    createdByUserId: String
    orderSource: String!
    status: String!
    paymentStatus: String!
    fulfillmentStatus: String!
    currencyCode: String!
    subtotal: Float!
    discountTotal: Float!
    taxTotal: Float!
    shippingTotal: Float!
    handlingFee: Float!
    totalAmount: Float!
    totalItems: Int!
    totalQuantity: Int!
    taxExempt: Boolean!
    orderDate: String!
    completedAt: String
    cancelledAt: String
    returnedAt: String
    customerEmail: String!
    customerPhone: String
    customerName: String
    customerNotes: String
    estimatedDeliveryDate: String
    hasGiftWrapping: Boolean!
    giftMessage: String
    isGift: Boolean!
    isSubscriptionOrder: Boolean!
    items: [OrderItem!]!
    shippingAddress: OrderAddress
    billingAddress: OrderAddress
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type OrderSummary {
    orderId: String!
    orderNumber: String!
    status: String!
    paymentStatus: String!
    fulfillmentStatus: String!
    totalAmount: Float!
    totalItems: Int!
    currencyCode: String!
    orderDate: String!
    createdAt: String!
  }

  type OrderListItem {
    orderId: String!
    orderNumber: String!
    customerId: String
    storeId: String
    channelId: String
    createdByUserId: String
    orderSource: String!
    customerEmail: String!
    customerName: String
    status: String!
    paymentStatus: String!
    fulfillmentStatus: String!
    totalAmount: Float!
    totalItems: Int!
    currencyCode: String!
    orderDate: String!
    createdAt: String!
    tags: [String!]!
  }

  type CustomerOrdersResult {
    orders: [OrderSummary!]!
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  type OrderListResult {
    orders: [OrderListItem!]!
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  input OrderFilterInput {
    customerId: String
    storeId: String
    channelId: String
    createdByUserId: String
    orderSource: String
    status: String
    paymentStatus: String
    fulfillmentStatus: String
    startDate: String
    endDate: String
    minAmount: Float
    maxAmount: Float
    tags: [String!]
    search: String
  }

  type Query {
    order(orderId: String, orderNumber: String): OrderDetail
    myOrders(customerId: String!, limit: Int, offset: Int, orderBy: String, orderDirection: String): CustomerOrdersResult!
    orders(filters: OrderFilterInput, limit: Int, offset: Int, orderBy: String, orderDirection: String): OrderListResult!
  }
`;
