/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type PaymentGateway = {
  paymentGatewayId: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  name: string;
  provider: string;
  isActive: boolean;
  isDefault: boolean;
  isTestMode: boolean;
  apiKey: string | null;
  apiSecret: string | null;
  publicKey: string | null;
  webhookSecret: string | null;
  apiEndpoint: string | null;
  supportedPaymentMethods: string;
  supportedCurrencies: string[] | null;
  processingFees: unknown | null;
  checkoutSettings: unknown | null;
  metadata: unknown | null;
  deletedAt: Date | null;
}

export type PaymentMethodConfig = {
  paymentMethodConfigId: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  paymentMethod: string;
  isEnabled: boolean;
  displayName: string | null;
  description: string | null;
  processingFeeCents: number | null;
  minimumAmountCents: number | null;
  maximumAmountCents: number | null;
  displayOrder: number;
  icon: string | null;
  supportedCurrencies: string[];
  countries: string[] | null;
  gatewayId: string | null;
  configuration: unknown | null;
  metadata: unknown | null;
  deletedAt: Date | null;
}

export type PaymentTransactionRecord = {
  paymentTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
  orderPaymentId: string;
  orderId: string;
  type: string;
  amountCents: number;
  currencyCode: string;
  status: string;
  transactionId: string | null;
  authorizationCode: string | null;
  responseCode: string | null;
  responseMessage: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  gatewayResponse: unknown | null;
  customerId: string | null;
  paymentMethodId: string | null;
  paymentGatewayId: string | null;
  externalTransactionId: string | null;
  paymentMethodDetails: unknown | null;
  refundedAmountCents: number | null;
  metadata: unknown | null;
  customerIp: string | null;
  authorizedAt: Date | null;
  capturedAt: Date | null;
  deletedAt: Date | null;
}

export type PaymentRefundRecord = {
  paymentRefundId: string;
  createdAt: Date;
  updatedAt: Date;
  orderPaymentId: string;
  orderId: string;
  transactionId: string | null;
  amountCents: number;
  currencyCode: string;
  reason: string | null;
  status: string;
  refundId: string | null;
  paymentTransactionId: string | null;
  externalRefundId: string | null;
  gatewayResponse: unknown | null;
  errorCode: string | null;
  errorMessage: string | null;
  processedAt: Date | null;
  metadata: unknown | null;
}

