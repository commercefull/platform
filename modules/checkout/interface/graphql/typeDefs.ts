export const checkoutTypeDefs = `#graphql
  type CheckoutAddress {
    firstName: String!
    lastName: String!
    addressLine1: String!
    city: String!
    postalCode: String!
    country: String!
  }

  type Checkout {
    checkoutId: String!
    basketId: String!
    customerId: String
    guestEmail: String
    status: String!
    paymentStatus: String!
    shippingAddress: CheckoutAddress
    billingAddress: CheckoutAddress
    shippingMethodId: String
    shippingMethodName: String
    paymentMethodId: String
    subtotal: Float!
    taxAmount: Float!
    shippingAmount: Float!
    discountAmount: Float!
    total: Float!
    currency: String!
    couponCode: String
    notes: String
    createdAt: String!
    updatedAt: String!
    expiresAt: String!
  }

  type CompleteCheckoutResult {
    orderId: String!
    checkoutId: String!
    total: Float!
    currency: String!
    status: String!
  }

  type AbandonCheckoutResult {
    message: String!
    checkoutId: String!
  }

  type CreatePaymentIntentResult {
    orderId: String!
    orderNumber: String!
    paymentIntent: PaymentIntent!
    status: String!
  }

  type PaymentIntent {
    id: String!
  }

  input AddressInput {
    firstName: String!
    lastName: String!
    addressLine1: String!
    city: String!
    postalCode: String!
    country: String!
    company: String
    addressLine2: String
    region: String
    phone: String
  }

  type Query {
    checkout(checkoutId: String!): Checkout
  }

  type Mutation {
    initiateCheckout(basketId: String!, customerId: String, guestEmail: String): Checkout!
    setShippingAddress(checkoutId: String!, address: AddressInput!): Checkout!
    setBillingAddress(checkoutId: String!, address: AddressInput!, sameAsShipping: Boolean): Checkout!
    setShippingMethod(checkoutId: String!, shippingMethodId: String!): Checkout!
    setPaymentMethod(checkoutId: String!, paymentMethodId: String!): Checkout!
    applyCoupon(checkoutId: String!, couponCode: String!): Checkout!
    removeCoupon(checkoutId: String!): Checkout!
    createPaymentIntent(checkoutId: String!, customerId: String): CreatePaymentIntentResult!
    completeCheckout(checkoutId: String!): CompleteCheckoutResult!
    abandonCheckout(checkoutId: String!): AbandonCheckoutResult!
  }
`;
