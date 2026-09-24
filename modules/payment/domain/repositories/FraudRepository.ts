/**
 * Fraud Repository Port
 *
 * Domain interface for fraud rules, checks, and blacklists.
 */

import type { FraudRule, BlacklistType } from '../entities/FraudRule';

/**
 * Narrow port consumed by `ScreenForFraudUseCase` — only the reads and the
 * trigger-counter write needed to evaluate a screening request.
 * Implemented by `infrastructure/repositories/fraudRepo`.
 */
export interface FraudScreeningRepositoryPort {
  getRules(activeOnly?: boolean): Promise<FraudRule[]>;
  incrementRuleTrigger(fraudRuleId: string): Promise<void>;
  isBlacklisted(type: BlacklistType, value: string): Promise<boolean>;
}

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
