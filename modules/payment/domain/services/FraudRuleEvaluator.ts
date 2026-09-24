/**
 * Fraud Rule Evaluator — domain service
 *
 * Pure fraud-screening logic extracted from the former application-layer
 * FraudScreeningService. No I/O — the use case fetches rules and blacklist
 * hits through the repository port and passes them here.
 *
 * Uses the shared `libs/rules/conditions` matcher (Epic A). Supports:
 * - Velocity rules (max orders per time window)
 * - AVS / risk signals (address mismatch, high-risk countries, proxy/VPN/Tor)
 * - Amount-based rules
 * - Pattern rules (first-order high value, guest checkout high value)
 * - Custom rules via generic condition matching
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic E.
 */

import { matchesConditions, type AttributeCondition } from '../../../../libs/rules/conditions';
import type { FraudRule, RuleAction, RiskLevel, CheckStatus } from '../entities/FraudRule';

// ============================================================================
// Types
// ============================================================================

export type ScreeningDecision = 'approved' | 'review' | 'blocked';

export interface FraudScreeningRequest {
  orderId?: string;
  customerId?: string;
  ipAddress?: string;
  email?: string;
  phone?: string;
  billingCountry?: string;
  shippingCountry?: string;
  orderAmountCents?: number;
  currency?: string;
  isFirstOrder?: boolean;
  isGuestCheckout?: boolean;
  paymentMethod?: string;
  cardBin?: string;
  cardCountry?: string;
  deviceFingerprint?: Record<string, unknown>;
  previousOrders?: number;
  previousChargebacks?: number;
  avsMatch?: boolean;
  cvvMatch?: boolean;
}

export interface TriggeredRuleInfo {
  fraudRuleId: string;
  name: string;
  ruleType: string;
  action: RuleAction;
  riskScore: number;
}

export interface FraudScreeningResult {
  decision: ScreeningDecision;
  riskScore: number;
  riskLevel: RiskLevel;
  status: CheckStatus;
  triggeredRules: TriggeredRuleInfo[];
  signals: Record<string, unknown>;
}

// ============================================================================
// Condition context
// ============================================================================

/**
 * Build a condition context for the shared `matchesConditions` matcher.
 * Maps the screening request to flat attributes that rules can match against.
 */
export function buildFraudConditionContext(request: FraudScreeningRequest): Record<string, unknown> {
  return {
    orderAmountCents: request.orderAmountCents ?? 0,
    currency: request.currency,
    customerId: request.customerId,
    ipAddress: request.ipAddress,
    email: request.email,
    phone: request.phone,
    billingCountry: request.billingCountry,
    shippingCountry: request.shippingCountry,
    addressMismatch: request.billingCountry !== request.shippingCountry,
    isFirstOrder: request.isFirstOrder ?? false,
    isGuestCheckout: request.isGuestCheckout ?? false,
    paymentMethod: request.paymentMethod,
    cardBin: request.cardBin,
    cardCountry: request.cardCountry,
    cardBinMismatch:
      request.cardBin && request.cardCountry && request.billingCountry ? request.cardCountry !== request.billingCountry : false,
    previousOrders: request.previousOrders ?? 0,
    previousChargebacks: request.previousChargebacks ?? 0,
    avsMatch: request.avsMatch ?? false,
    cvvMatch: request.cvvMatch ?? false,
    highRiskCountry: isHighRiskCountry(request.billingCountry) || isHighRiskCountry(request.shippingCountry),
    ...request.deviceFingerprint,
  };
}

// ============================================================================
// Rule evaluation
// ============================================================================

/**
 * Evaluate a rule using both the legacy rule-type-specific logic and
 * the shared condition matcher. If the rule has `conditions` as an array
 * of `AttributeCondition`, use the shared matcher; otherwise fall back to
 * the legacy rule-type-specific evaluation.
 */
export function fraudRuleMatches(rule: FraudRule, request: FraudScreeningRequest, context: Record<string, unknown>): boolean {
  const conditions = rule.conditions;
  if (Array.isArray(conditions)) {
    return matchesConditions(context, conditions as AttributeCondition[]);
  }

  return evaluateLegacyRule(rule, request);
}

/**
 * Legacy rule-type-specific evaluation (backward compatibility).
 * Mirrors the existing `evaluateRule` in `fraudRepo.ts`.
 */
function evaluateLegacyRule(rule: FraudRule, request: FraudScreeningRequest): boolean {
  const conditions = rule.conditions as Record<string, unknown>;

  switch (rule.ruleType) {
    case 'amount':
      if (conditions.minAmount && (request.orderAmountCents ?? 0) < (conditions.minAmount as number)) return false;
      if (conditions.maxAmount && (request.orderAmountCents ?? 0) > (conditions.maxAmount as number)) return true;
      return false;

    case 'location':
      if ((conditions.highRiskCountries as string[] | undefined)?.includes(request.billingCountry || '')) return true;
      if ((conditions.highRiskCountries as string[] | undefined)?.includes(request.shippingCountry || '')) return true;
      if (conditions.requireAddressMatch && request.billingCountry !== request.shippingCountry) return true;
      return false;

    case 'velocity':
      if (conditions.maxOrdersPerDay && (request.previousOrders ?? 0) >= (conditions.maxOrdersPerDay as number)) return true;
      return false;

    case 'pattern':
      if (
        conditions.firstOrderHighValue &&
        request.isFirstOrder &&
        (request.orderAmountCents ?? 0) > ((conditions.threshold as number) || 500)
      )
        return true;
      if (
        conditions.guestCheckoutHighValue &&
        request.isGuestCheckout &&
        (request.orderAmountCents ?? 0) > ((conditions.threshold as number) || 300)
      )
        return true;
      return false;

    case 'device':
      if (conditions.blockProxy && request.deviceFingerprint?.isProxy) return true;
      if (conditions.blockVpn && request.deviceFingerprint?.isVpn) return true;
      if (conditions.blockTor && request.deviceFingerprint?.isTor) return true;
      return false;

    default:
      return false;
  }
}

/**
 * Check if a country is in the high-risk countries list.
 * This is a simplified check; in production, this would be configurable.
 */
export function isHighRiskCountry(country?: string): boolean {
  if (!country) return false;
  const highRisk = ['XX', 'YY', 'ZZ']; // Placeholder — would be configurable
  return highRisk.includes(country);
}

// ============================================================================
// Decision / status derivation
// ============================================================================

export function actionPriority(action: RuleAction): number {
  switch (action) {
    case 'block':
      return 4;
    case 'review':
      return 3;
    case 'flag':
      return 2;
    case 'allow':
      return 1;
    default:
      return 0;
  }
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Convert the highest action and risk level to a screening decision.
 */
export function toScreeningDecision(highestAction: RuleAction, riskLevel: RiskLevel): ScreeningDecision {
  if (highestAction === 'block' || riskLevel === 'critical') return 'blocked';
  if (highestAction === 'review' || riskLevel === 'high') return 'review';
  if (highestAction === 'flag' || riskLevel === 'medium') return 'review';
  return 'approved';
}

/**
 * Convert a screening decision to a check status.
 */
export function toCheckStatus(decision: ScreeningDecision): CheckStatus {
  switch (decision) {
    case 'approved':
      return 'passed';
    case 'review':
      return 'flagged';
    case 'blocked':
      return 'blocked';
  }
}
