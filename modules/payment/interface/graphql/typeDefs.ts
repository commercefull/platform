export const paymentTypeDefs = `#graphql
  type PaymentMethodInfo {
    paymentMethodId: String!
    type: String!
    provider: String!
    name: String!
    isDefault: Boolean!
    isSaved: Boolean
    last4: String
    brand: String
    expiryMonth: Int
    expiryYear: Int
    isAvailable: Boolean!
    minAmountCents: Float
    maxAmountCents: Float
    supportedCurrencies: [String!]
  }

  type PaymentMethodsResult {
    savedMethods: [PaymentMethodInfo!]!
    availableMethods: [PaymentMethodInfo!]!
  }

  type PaymentTransaction {
    transactionId: String!
    orderId: String!
    customerId: String
    paymentMethodConfigId: String!
    gatewayId: String!
    externalTransactionId: String
    amountCents: Float!
    currency: String!
    status: String!
    refundedAmountCents: Float!
    refundableAmount: Float!
    isPaid: Boolean!
    canBeRefunded: Boolean!
    authorizedAt: String
    capturedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type TransactionListResult {
    transactions: [PaymentTransaction!]!
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  type InitiatePaymentResult {
    transactionId: String!
    orderId: String!
    amountCents: Float!
    currency: String!
    status: String!
    createdAt: String!
  }

  type ProcessRefundResult {
    refundId: String!
    transactionId: String!
    amountCents: Float!
    currency: String!
    status: String!
    createdAt: String!
  }

  type CapturePaymentResult {
    transactionId: String!
    capturedAmount: Float!
    status: String!
    capturedAt: String!
    remainingAmount: Float
  }

  input PaymentMethodsInput {
    customerId: String
    storeId: String
    channelId: String
    currency: String
    amountCents: Float
    country: String
  }

  input TransactionFilterInput {
    orderId: String
    customerId: String
    status: String
    gatewayId: String
    startDate: String
    endDate: String
  }

  type Query {
    paymentMethods(input: PaymentMethodsInput): PaymentMethodsResult!
    transaction(transactionId: String, externalId: String): PaymentTransaction
    transactions(filters: TransactionFilterInput, limit: Int, offset: Int, orderBy: String, orderDirection: String): TransactionListResult!
  }

  type Mutation {
    initiatePayment(
      orderId: String!
      amountCents: Float!
      currency: String!
      paymentMethodConfigId: String!
      customerId: String
      customerIp: String
    ): InitiatePaymentResult!

    processRefund(
      transactionId: String!
      amountCents: Float!
      reason: String
    ): ProcessRefundResult!

    capturePayment(
      transactionId: String!
      amountCents: Float
    ): CapturePaymentResult!
  }
`;
