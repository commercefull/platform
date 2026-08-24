import { PaymentGateway, PaymentMethodConfig, PaymentTransaction, PaymentRefund } from '../../../../libs/db/types';

type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PaymentGatewayCreateParams = Omit<PaymentGateway, 'paymentGatewayId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentGatewayUpdateParams = Partial<PaymentGatewayCreateParams>;

export type PaymentMethodConfigCreateParams = Omit<PaymentMethodConfig, 'paymentMethodConfigId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentMethodConfigUpdateParams = Partial<PaymentMethodConfigCreateParams>;

export type PaymentTransactionCreateParams = MakeOptional<
  Omit<PaymentTransaction, 'paymentTransactionId' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  'transactionId' | 'authorizationCode' | 'responseCode' | 'responseMessage' | 'errorCode' | 'errorMessage' | 'gatewayResponse' | 'customerId' | 'paymentMethodId' | 'paymentGatewayId' | 'externalTransactionId' | 'currency' | 'paymentMethodDetails' | 'refundedAmount' | 'metadata' | 'customerIp' | 'authorizedAt' | 'capturedAt'
>;
export type PaymentTransactionUpdateParams = Partial<PaymentTransactionCreateParams>;

export type PaymentRefundCreateParams = MakeOptional<
  Omit<PaymentRefund, 'paymentRefundId' | 'createdAt' | 'updatedAt'>,
  'transactionId' | 'reason' | 'refundId' | 'paymentTransactionId' | 'externalRefundId' | 'currency' | 'gatewayResponse' | 'errorCode' | 'errorMessage' | 'processedAt' | 'metadata'
>;
export type PaymentRefundUpdateParams = Partial<PaymentRefundCreateParams>;

export interface PaymentGatewayRepository {
  // Gateways
  findAllGateways(organizationId: string): Promise<PaymentGateway[]>;
  findGatewayById(id: string): Promise<PaymentGateway | null>;
  findDefaultGateway(organizationId: string): Promise<PaymentGateway | null>;
  createGateway(params: PaymentGatewayCreateParams): Promise<PaymentGateway>;
  updateGateway(id: string, params: PaymentGatewayUpdateParams): Promise<PaymentGateway>;
  deleteGateway(id: string): Promise<boolean>;

  // Method configs
  findAllMethodConfigs(organizationId: string): Promise<PaymentMethodConfig[]>;
  findMethodConfigById(id: string): Promise<PaymentMethodConfig | null>;
  findEnabledMethodConfigs(organizationId: string): Promise<PaymentMethodConfig[]>;
  createMethodConfig(params: PaymentMethodConfigCreateParams): Promise<PaymentMethodConfig>;
  updateMethodConfig(id: string, params: PaymentMethodConfigUpdateParams): Promise<PaymentMethodConfig>;
  deleteMethodConfig(id: string): Promise<boolean>;

  // Transactions
  findTransactionById(id: string): Promise<PaymentTransaction | null>;
  findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]>;
  findTransactionsByCustomerId(customerId: string, limit?: number, offset?: number): Promise<PaymentTransaction[]>;
  createTransaction(params: PaymentTransactionCreateParams): Promise<PaymentTransaction>;
  updateTransaction(id: string, params: PaymentTransactionUpdateParams): Promise<PaymentTransaction>;

  // Refunds
  findRefundById(id: string): Promise<PaymentRefund | null>;
  findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]>;
  createRefund(params: PaymentRefundCreateParams): Promise<PaymentRefund>;
  updateRefund(id: string, params: PaymentRefundUpdateParams): Promise<PaymentRefund>;

  // Payment processing
  processPayment(paymentData: {
    orderPaymentId: string;
    orderId: string;
    customerId?: string;
    amount: number;
    currency: string;
    paymentMethodId?: string;
    paymentGatewayId?: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }>;
  processRefund(refundData: {
    orderPaymentId: string;
    orderId: string;
    paymentTransactionId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Promise<{ success: boolean; refundId?: string; error?: string }>;
}
