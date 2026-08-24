/**
 * Consolidated Payment Billing Repository Port
 *
 * Merges PaymentBalance, PaymentDispute, PaymentFee, and PaymentReport
 * sub-ports into a single aggregate-aligned port.
 */

import type { PaymentBalance } from './PaymentBalanceRepository';
import type { PaymentDispute } from './PaymentDisputeRepository';
import type { PaymentFee } from './PaymentFeeRepository';
import type { PaymentReport } from './PaymentReportRepository';

// Re-export types for backward compatibility
export type { PaymentBalance, BalanceTransaction } from './PaymentBalanceRepository';
export type { PaymentDispute } from './PaymentDisputeRepository';
export type { PaymentFee } from './PaymentFeeRepository';
export type { PaymentReport } from './PaymentReportRepository';

export interface PaymentBillingRepository {
  // Balances
  findBalancesByMerchant(organizationId: string): Promise<PaymentBalance[]>;
  creditBalance(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null>;
  debitBalance(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null>;
  getBalance(organizationId: string, currency: string): Promise<number>;
  findAllBalances(): Promise<PaymentBalance[]>;

  // Disputes
  findDisputesByPayment(paymentId: string): Promise<PaymentDispute[]>;
  findDisputeById(paymentDisputeId: string): Promise<PaymentDispute | null>;
  createDispute(params: Omit<PaymentDispute, 'paymentDisputeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentDispute | null>;
  updateDisputeStatus(paymentDisputeId: string, status: string, resolvedAt?: Date): Promise<PaymentDispute | null>;
  findAllDisputes(status?: string, limit?: number): Promise<PaymentDispute[]>;

  // Fees
  findFeesByTransaction(transactionId: string): Promise<PaymentFee[]>;
  createFee(params: Omit<PaymentFee, 'paymentFeeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentFee | null>;
  sumFeesByMerchant(organizationId: string, currency: string): Promise<number>;
  findAllFees(limit?: number): Promise<PaymentFee[]>;

  // Reports
  findReportsByMerchant(organizationId: string): Promise<PaymentReport[]>;
  findReportsByDateRange(organizationId: string, from: Date, to: Date): Promise<PaymentReport[]>;
  createReport(params: Omit<PaymentReport, 'paymentReportId' | 'createdAt' | 'updatedAt'>): Promise<PaymentReport | null>;
  findAllReports(limit?: number): Promise<PaymentReport[]>;
  findReportById(paymentReportId: string): Promise<PaymentReport | null>;
}
