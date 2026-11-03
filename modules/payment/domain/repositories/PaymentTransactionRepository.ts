/**
 * Payment Transaction Repository Port
 *
 * Read/write access to payment transactions.
 */

import { PaymentTransaction } from '../entities/PaymentTransaction';
import { TransactionStatus } from '../valueObjects/PaymentStatus';
import { PaginatedResult, PaginationOptions } from 'libs/types/pagination';

export interface PaymentFilters {
  orderId?: string;
  customerId?: string;
  status?: TransactionStatus | TransactionStatus[];
  gatewayId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentTransactionRepository {
  findTransactionById(transactionId: string): Promise<PaymentTransaction | null>;
  findTransactionByExternalId(externalId: string): Promise<PaymentTransaction | null>;
  findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]>;
  findTransactionsByCustomerId(customerId: string, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>>;
  findAllTransactions(filters?: PaymentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>>;
  saveTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  countTransactions(filters?: PaymentFilters): Promise<number>;
  deleteTransaction(transactionId: string): Promise<void>;
}
