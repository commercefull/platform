/**
 * Payment Repository Interface
 */

import { PaymentTransaction } from '../entities/PaymentTransaction';
import { PaymentRefund } from '../entities/PaymentRefund';
import { TransactionStatus } from '../valueObjects/PaymentStatus';
import { PaginatedResult, PaginationOptions } from 'libs/types/shared';
import type { PaymentSettings, PaymentSettingsUpsertParams } from './PaymentSettingsRepository';
import type { PaymentWebhook, PaymentWebhookCreateParams } from './PaymentWebhookRepository';
import type { StoredPaymentMethod, StoredPaymentMethodCreateParams } from './StoredPaymentMethodRepository';

// Re-export types for backward compatibility
export type { PaymentSettings, PaymentSettingsUpsertParams } from './PaymentSettingsRepository';
export type { PaymentWebhook, PaymentWebhookCreateParams } from './PaymentWebhookRepository';
export type { StoredPaymentMethod, StoredPaymentMethodCreateParams } from './StoredPaymentMethodRepository';

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
    organizationId: string,
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
  getDefaultGateway(organizationId: string): Promise<{
    gatewayId: string;
    provider: string;
    isTestMode: boolean;
  } | null>;

  // Settings
  findSettingsByMerchant(organizationId: string): Promise<PaymentSettings | null>;
  upsertSettings(params: PaymentSettingsUpsertParams): Promise<PaymentSettings | null>;
  findAllSettings(): Promise<PaymentSettings[]>;

  // Webhooks
  findWebhookByExternalId(externalId: string): Promise<PaymentWebhook | null>;
  createWebhook(params: PaymentWebhookCreateParams): Promise<PaymentWebhook | null>;
  markWebhookProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null>;

  // Stored Payment Methods
  findStoredMethodsByCustomer(customerId: string): Promise<StoredPaymentMethod[]>;
  findStoredMethodById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null>;
  createStoredMethod(params: StoredPaymentMethodCreateParams): Promise<StoredPaymentMethod | null>;
  setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null>;
  softDeleteStoredMethod(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null>;
}
