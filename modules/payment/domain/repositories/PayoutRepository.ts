/**
 * Payout Repository Port
 *
 * Domain interface for payout, payout items, payout settings, balances,
 * disputes, fees, reports, and subscription invoices.
 */

export interface PayoutRepository {
  // Payouts
  createPayout(params: Record<string, unknown>): Promise<unknown>;
  findPayoutById(payoutId: string): Promise<unknown | null>;
  listPayouts(organizationId: string, filters?: Record<string, unknown>): Promise<unknown[]>;
  updatePayoutStatus(payoutId: string, status: string, details?: Record<string, unknown>): Promise<void>;

  // Payout items
  createPayoutItem(params: Record<string, unknown>): Promise<unknown>;

  // Payout settings
  getPayoutSettings(organizationId: string): Promise<unknown | null>;
  savePayoutSettings(organizationId: string, params: Record<string, unknown>): Promise<unknown>;

  // Balances
  getPaymentBalance(organizationId: string): Promise<unknown | null>;
  listPaymentBalances(organizationId: string): Promise<unknown[]>;

  // Disputes
  createDispute(params: Record<string, unknown>): Promise<unknown>;
  findDisputeById(disputeId: string): Promise<unknown | null>;
  listDisputes(filters?: Record<string, unknown>): Promise<unknown[]>;
  updateDisputeStatus(disputeId: string, status: string, details?: Record<string, unknown>): Promise<void>;

  // Fees
  createFee(params: Record<string, unknown>): Promise<unknown>;
  listFees(filters?: Record<string, unknown>): Promise<unknown[]>;

  // Reports
  createReport(params: Record<string, unknown>): Promise<unknown>;
  findReportById(reportId: string): Promise<unknown | null>;
  listReports(filters?: Record<string, unknown>): Promise<unknown[]>;

  // Payment plans
  createPaymentPlan(params: Record<string, unknown>): Promise<unknown>;
  findPaymentPlanById(planId: string): Promise<unknown | null>;

  // Subscription invoices
  createSubscriptionInvoice(params: Record<string, unknown>): Promise<unknown>;
  findSubscriptionInvoiceById(invoiceId: string): Promise<unknown | null>;
  listSubscriptionInvoices(subscriptionId: string): Promise<unknown[]>;
  updateSubscriptionInvoiceStatus(invoiceId: string, status: string): Promise<void>;

  // Stored payment methods
  findStoredPaymentMethodById(id: string): Promise<unknown | null>;
  findStoredPaymentMethodsByCustomer(customerId: string): Promise<unknown[]>;
  createStoredPaymentMethod(params: Record<string, unknown>): Promise<unknown>;
  updateStoredPaymentMethod(id: string, updates: Record<string, unknown>): Promise<void>;
  deleteStoredPaymentMethod(id: string): Promise<void>;

  // Settings
  getPaymentSettings(organizationId: string): Promise<unknown | null>;
  savePaymentSettings(organizationId: string, params: Record<string, unknown>): Promise<unknown>;

  // Webhooks
  createWebhookRecord(params: Record<string, unknown>): Promise<unknown>;
  findWebhookByEventId(eventId: string): Promise<unknown | null>;
}
