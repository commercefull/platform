/**
 * Payment Repository Interface
 */

import { PaymentTransaction } from '../entities/PaymentTransaction';
import { PaymentRefund } from '../entities/PaymentRefund';
import { TransactionStatus } from '../valueObjects/PaymentStatus';
import { PaginatedResult, PaginationOptions } from 'libs/types/shared';

export interface PaymentFilters {
  orderId?: string;
  customerId?: string;
  status?: TransactionStatus | TransactionStatus[];
  gatewayId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentRepository {
  // Transactions
  findTransactionById(transactionId: string): Promise<PaymentTransaction | null>;
  findTransactionByExternalId(externalId: string): Promise<PaymentTransaction | null>;
  findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]>;
  findTransactionsByCustomerId(customerId: string, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>>;
  findAllTransactions(filters?: PaymentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>>;
  saveTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  countTransactions(filters?: PaymentFilters): Promise<number>;

  // Refunds
  findRefundById(refundId: string): Promise<PaymentRefund | null>;
  findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]>;
  saveRefund(refund: PaymentRefund): Promise<PaymentRefund>;

  // Payment Methods
  getEnabledPaymentMethods(
    merchantId: string,
    currency?: string,
  ): Promise<
    Array<{
      paymentMethodConfigId: string;
      paymentMethod: string;
      displayName: string;
      description?: string;
      icon?: string;
      processingFee?: number;
    }>
  >;

  // Gateways
  getDefaultGateway(merchantId: string): Promise<{
    gatewayId: string;
    provider: string;
    isTestMode: boolean;
  } | null>;
}
