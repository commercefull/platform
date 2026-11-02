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


