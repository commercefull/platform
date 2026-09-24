/**
 * ScreenForFraud Use Case
 *
 * Screens an order against all active fraud rules and blacklists.
 * Orchestration only — condition matching, decision, and risk-level
 * derivation live in the domain evaluator
 * (`domain/services/FraudRuleEvaluator`).
 *
 * Returns a `FraudScreeningResult` with a decision (approved/review/blocked),
 * risk score, risk level, and triggered rules.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic E.
 */

import type { FraudScreeningRepositoryPort } from '../../domain/repositories/FraudRepository';
import type { RuleAction, BlacklistType } from '../../domain/entities/FraudRule';
import {
  buildFraudConditionContext,
  fraudRuleMatches,
  actionPriority,
  getRiskLevel,
  toScreeningDecision,
  toCheckStatus,
  type FraudScreeningRequest,
  type FraudScreeningResult,
  type TriggeredRuleInfo,
} from '../../domain/services/FraudRuleEvaluator';

export type {
  FraudScreeningRequest,
  FraudScreeningResult,
  TriggeredRuleInfo,
  ScreeningDecision,
} from '../../domain/services/FraudRuleEvaluator';

export class ScreenForFraudUseCase {
  constructor(private readonly fraudRepo: FraudScreeningRepositoryPort) {}

  /**
   * Screen an order against all active fraud rules and blacklists.
   */
  async execute(request: FraudScreeningRequest): Promise<FraudScreeningResult> {
    const rules = await this.fraudRepo.getRules(true);
    const triggeredRules: TriggeredRuleInfo[] = [];
    let totalRiskScore = 0;
    let highestAction: RuleAction = 'allow';
    const signals: Record<string, unknown> = {};

    // 1. Check blacklists first (highest priority — immediate block)
    const blacklistHit = await this.checkBlacklists(request);
    if (blacklistHit.hit) {
      totalRiskScore = 100;
      highestAction = 'block';
      signals.blacklistHit = blacklistHit;
      triggeredRules.push({
        fraudRuleId: 'blacklist',
        name: `Blacklist: ${blacklistHit.type}`,
        ruleType: 'blacklist',
        action: 'block',
        riskScore: 100,
      });
    }

    // 2. Evaluate each rule using shared condition matching
    if (highestAction !== 'block') {
      const context = buildFraudConditionContext(request);

      for (const rule of rules) {
        const triggered = fraudRuleMatches(rule, request, context);
        if (triggered) {
          triggeredRules.push({
            fraudRuleId: rule.fraudRuleId,
            name: rule.name,
            ruleType: rule.ruleType,
            action: rule.action,
            riskScore: rule.riskScore,
          });
          totalRiskScore += rule.riskScore;
          if (actionPriority(rule.action) > actionPriority(highestAction)) {
            highestAction = rule.action;
          }
          // Increment trigger count asynchronously (fire-and-forget)
          this.fraudRepo.incrementRuleTrigger(rule.fraudRuleId).catch(() => {});
        }
      }
    }

    // 3. Cap risk score at 100
    totalRiskScore = Math.min(totalRiskScore, 100);

    // 4. Determine risk level and decision
    const riskLevel = getRiskLevel(totalRiskScore);
    const decision = toScreeningDecision(highestAction, riskLevel);
    const status = toCheckStatus(decision);

    return {
      decision,
      riskScore: totalRiskScore,
      riskLevel,
      status,
      triggeredRules,
      signals,
    };
  }

  /**
   * Check all relevant blacklists for the request.
   */
  private async checkBlacklists(request: FraudScreeningRequest): Promise<{ hit: boolean; type?: BlacklistType; value?: string }> {
    const checks: Array<{ type: BlacklistType; value?: string }> = [
      { type: 'ip', value: request.ipAddress },
      { type: 'email', value: request.email },
      { type: 'phone', value: request.phone },
      { type: 'card_bin', value: request.cardBin },
      { type: 'customer', value: request.customerId },
    ];

    for (const { type, value } of checks) {
      if (value) {
        const hit = await this.fraudRepo.isBlacklisted(type, value);
        if (hit) return { hit: true, type, value };
      }
    }

    return { hit: false };
  }
}
