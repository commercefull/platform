/**
 * Policy Engine — Facts → Policy → Decision
 *
 * Evaluates declarative `PolicyRule`s against a fact context and returns
 * versioned, explainable `PolicyDecisionRecord`s. Used for compliance
 * (age restriction, embargoes, customs), privacy regimes, and any domain
 * that needs an auditable "why did the platform do this?" answer.
 *
 * Admission criteria (mirrors `libs/rules/conditions.ts`):
 * - No dependencies on `modules/*`, no I/O.
 * - Builds on `libs/rules/conditions` + `libs/rules/resolver` only.
 */

import { AttributeCondition, ConditionContext, matchesConditions } from './conditions';
import { filterDateActive } from './resolver';

/** What a matching policy does to the decision. */
type PolicyEffect = 'allow' | 'deny' | 'require_obligation';

/**
 * A versioned policy rule. `conditions` match against the fact context;
 * `priority` breaks ties when multiple rules match (higher wins).
 */
export interface PolicyRule {
  policyId: string;
  policyCode: string;
  domain: 'compliance' | 'tax' | 'promotion' | 'returns' | 'marketplace' | 'privacy' | string;
  version: string;
  effect: PolicyEffect;
  /** Stable machine-readable explanation, e.g. 'AGE_RESTRICTION'. */
  reasonCode: string;
  /** Obligations the caller must satisfy when effect is 'require_obligation'. */
  obligations?: string[];
  conditions: AttributeCondition[];
  /** Higher priority wins when multiple rules match. */
  priority: number;
  isActive: boolean;
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
}

/**
 * Immutable, explainable record of one policy evaluation. Persisted on
 * `order.decisionLog` (and surfaced to callers) so the decision can be
 * replayed and audited later.
 */
export interface PolicyDecisionRecord {
  decisionId: string;
  domain: string;
  /** What was decided, e.g. 'compliance_check', 'promotion_eligible'. */
  decision: string;
  allowed: boolean;
  /** Winning rule (null when no rule matched → default-allow). */
  policyId?: string;
  policyCode?: string;
  version?: string;
  reasonCode: string;
  /** Obligations surfaced from 'require_obligation' rules. */
  obligations: string[];
  /** Fact inputs the decision was computed from (snapshot). */
  inputs: ConditionContext;
  /** Rule-specific outputs (discounts, rate codes, etc.). */
  outputs?: Record<string, unknown>;
  evaluatedAt: Date;
}

export interface EvaluatePoliciesInput {
  /** What is being decided, e.g. 'compliance_check'. */
  decision: string;
  /** Domain of rules to evaluate ('compliance', 'privacy', …). */
  domain: string;
  /** Facts the conditions match against. */
  facts: ConditionContext;
  rules: PolicyRule[];
  /** Evaluation instant for date-effectivity filtering. */
  now?: Date;
  /** Optional deterministic decisionId (generated if omitted). */
  decisionId?: string;
  /** Extra rule outputs to embed in the record. */
  outputs?: Record<string, unknown>;
}

let decisionCounter = 0;

function nextDecisionId(): string {
  decisionCounter += 1;
  return `dec_${Date.now().toString(36)}_${decisionCounter.toString(36)}`;
}

/**
 * Evaluate `rules` against `facts` and return the winning decision.
 *
 * Resolution: active → date-effective → condition-matching → highest
 * priority → first declared (stable). A `deny` beats `require_obligation`,
 * which beats `allow`. No matching rule → `allowed: true` with
 * `reasonCode: 'NO_MATCHING_POLICY'` (default-allow).
 */
export function evaluatePolicies(input: EvaluatePoliciesInput): PolicyDecisionRecord {
  const now = input.now ?? new Date();
  const domainRules = input.rules.filter(r => r.isActive && r.domain === input.domain);
  const effective = filterDateActive(domainRules, now);
  const matching = effective.filter(r => matchesConditions(input.facts, r.conditions));

  const base: Omit<PolicyDecisionRecord, 'allowed' | 'reasonCode' | 'policyId' | 'policyCode' | 'version' | 'obligations'> = {
    decisionId: input.decisionId ?? nextDecisionId(),
    domain: input.domain,
    decision: input.decision,
    inputs: { ...input.facts },
    outputs: input.outputs,
    evaluatedAt: now,
  };

  if (matching.length === 0) {
    return {
      ...base,
      allowed: true,
      reasonCode: 'NO_MATCHING_POLICY',
      obligations: [],
    };
  }

  // Effect severity: deny > require_obligation > allow.
  const effectRank: Record<PolicyEffect, number> = { deny: 2, require_obligation: 1, allow: 0 };
  const winning = [...matching].sort((a, b) => {
    if (effectRank[b.effect] !== effectRank[a.effect]) return effectRank[b.effect] - effectRank[a.effect];
    if (b.priority !== a.priority) return b.priority - a.priority;
    return 0;
  })[0];

  const obligations = matching.filter(r => r.effect === 'require_obligation').flatMap(r => r.obligations ?? []);

  return {
    ...base,
    allowed: winning.effect !== 'deny',
    policyId: winning.policyId,
    policyCode: winning.policyCode,
    version: winning.version,
    reasonCode: winning.reasonCode,
    obligations,
  };
}
