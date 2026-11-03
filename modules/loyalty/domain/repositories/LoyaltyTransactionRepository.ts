/**
 * Loyalty Transaction Repository Port
 *
 * Domain interface for loyalty transaction persistence.
 */

import type { LoyaltyTransaction } from '../entities/LoyaltyModel';

export interface CreateLoyaltyTransactionInput {
  customerId: string;
  orderId?: string;
  action: string;
  points: number;
  description?: string;
  referenceId?: string;
}

export interface LoyaltyTransactionRepository {
  findTransactionById(loyaltyTransactionId: string): Promise<LoyaltyTransaction | null>;
  findTransactionByOrderAndAction(orderId: string, action: 'credit' | 'debit'): Promise<LoyaltyTransaction | null>;
  findCreditTransactionByReference(referenceId: string): Promise<LoyaltyTransaction | null>;
  findCustomerTransactions(customerId: string, limit?: number): Promise<LoyaltyTransaction[]>;
  createTransaction(input: CreateLoyaltyTransactionInput): Promise<LoyaltyTransaction>;
}
