/**
 * Payment repository param types — shared between paymentRepo and its query helpers.
 */

import type { PaymentGateway, PaymentMethodConfig, PaymentTransaction, PaymentRefund } from '../../../../libs/db/types';

type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PaymentGatewayCreateParams = Omit<PaymentGateway, 'paymentGatewayId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentGatewayUpdateParams = Partial<PaymentGatewayCreateParams>;

export type PaymentMethodConfigCreateParams = Omit<PaymentMethodConfig, 'paymentMethodConfigId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentMethodConfigUpdateParams = Partial<PaymentMethodConfigCreateParams>;

export type PaymentTransactionCreateParams = MakeOptional<
  Omit<PaymentTransaction, 'paymentTransactionId' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  | 'transactionId'
  | 'authorizationCode'
  | 'responseCode'
  | 'responseMessage'
  | 'errorCode'
  | 'errorMessage'
  | 'gatewayResponse'
  | 'customerId'
  | 'paymentMethodId'
  | 'paymentGatewayId'
  | 'externalTransactionId'
  | 'currencyCode'
  | 'paymentMethodDetails'
  | 'refundedAmountCents'
  | 'metadata'
  | 'customerIp'
  | 'authorizedAt'
  | 'capturedAt'
>;
export type PaymentTransactionUpdateParams = Partial<PaymentTransactionCreateParams>;

export type PaymentRefundCreateParams = MakeOptional<
  Omit<PaymentRefund, 'paymentRefundId' | 'createdAt' | 'updatedAt'>,
  | 'transactionId'
  | 'reason'
  | 'refundId'
  | 'paymentTransactionId'
  | 'externalRefundId'
  | 'currencyCode'
  | 'gatewayResponse'
  | 'errorCode'
  | 'errorMessage'
  | 'processedAt'
  | 'metadata'
>;
export type PaymentRefundUpdateParams = Partial<PaymentRefundCreateParams>;
