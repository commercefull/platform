/**
 * Fraud Repository Port
 *
 * Domain interface for fraud rules, checks, and blacklists.
 */

export interface FraudRepository {
  // Rules
  getRules(activeOnly?: boolean): Promise<unknown[]>;
  getRuleById(ruleId: string): Promise<unknown | null>;
  createRule(params: Record<string, unknown>): Promise<unknown>;
  updateRule(ruleId: string, updates: Record<string, unknown>): Promise<unknown | null>;
  deleteRule(ruleId: string): Promise<void>;

  // Checks
  createCheck(params: Record<string, unknown>): Promise<unknown>;
  getCheck(checkId: string): Promise<unknown | null>;
  getChecksByOrder(orderId: string): Promise<unknown[]>;
  updateCheckStatus(checkId: string, status: string, details?: Record<string, unknown>): Promise<void>;
  runFraudCheck(fraudCheckId: string): Promise<unknown>;

  // Blacklist
  addToBlacklist(params: Record<string, unknown>): Promise<unknown>;
  checkBlacklist(type: string, value: string): Promise<boolean>;
  removeFromBlacklist(blacklistId: string): Promise<void>;
  listBlacklist(filters?: Record<string, unknown>): Promise<unknown[]>;
}
