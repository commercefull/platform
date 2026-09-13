/**
 * Fraud Screening Service
 *
 * Evaluates an order against fraud rules using the shared `libs/rules/conditions`
 * matcher (Epic A). Replaces the ad-hoc `evaluateRule` switch in `fraudRepo.ts`
 * with a generic condition-matching approach that supports all operators
 * (eq, neq, gt, gte, lt, lte, in) and arbitrary attributes.
 *
 * Supports:
 * - Velocity rules (max orders per time window)
 * - Blocklist checks (email, IP, phone, card BIN, customer, device)
 * - AVS / risk signals (address mismatch, high-risk countries, proxy/VPN/Tor)
 * - Amount-based rules
 * - Pattern rules (first-order high value, guest checkout high value)
 * - Custom rules via generic condition matching
 *
 * Returns a `FraudScreeningResult` with a decision (approved/review/blocked),
 * risk score, risk level, and triggered rules.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic E.
 */

import { matchesConditions, type AttributeCondition } from '../../../../libs/rules/conditions';
import * as fraudRepo from '../../infrastructure/repositories/fraudRepo';
import type { FraudRule, RuleAction, RiskLevel, CheckStatus, BlacklistType } from '../../infrastructure/repositories/fraudRepo';

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
  orderAmount?: number;
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
// Service
// ============================================================================

export class FraudScreeningService {
  /**
   * Screen an order against all active fraud rules and blacklists.
   */
  async screen(request: FraudScreeningRequest): Promise<FraudScreeningResult> {
    const rules = await fraudRepo.getRules(true);
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
      const context = this.buildConditionContext(request);

      for (const rule of rules) {
        const triggered = this.evaluateRuleWithConditions(rule, request, context);
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
          fraudRepo.incrementRuleTrigger(rule.fraudRuleId).catch(() => {});
        }
      }
    }

    // 3. Cap risk score at 100
    totalRiskScore = Math.min(totalRiskScore, 100);

    // 4. Determine risk level and decision
    const riskLevel = getRiskLevel(totalRiskScore);
    const decision = this.toDecision(highestAction, riskLevel);
    const status = this.toStatus(decision);

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
        const hit = await fraudRepo.isBlacklisted(type, value);
        if (hit) return { hit: true, type, value };
      }
    }

    return { hit: false };
  }

  /**
   * Build a condition context for the shared `matchesConditions` matcher.
   * Maps the screening request to flat attributes that rules can match against.
   */
  private buildConditionContext(request: FraudScreeningRequest): Record<string, unknown> {
    return {
      orderAmount: request.orderAmount ?? 0,
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
      highRiskCountry: this.isHighRiskCountry(request.billingCountry) || this.isHighRiskCountry(request.shippingCountry),
      ...request.deviceFingerprint,
    };
  }

  /**
   * Evaluate a rule using both the legacy rule-type-specific logic and
   * the shared condition matcher. If the rule has `conditions` as an array
   * of `AttributeCondition`, use the shared matcher; otherwise fall back to
   * the legacy rule-type-specific evaluation.
   */
  private evaluateRuleWithConditions(rule: FraudRule, request: FraudScreeningRequest, context: Record<string, unknown>): boolean {
    // Try shared condition matcher first (if conditions is an array of AttributeCondition)
    const conditions = rule.conditions;
    if (Array.isArray(conditions)) {
      return matchesConditions(context, conditions as AttributeCondition[]);
    }

    // Fall back to legacy rule-type-specific evaluation
    return this.evaluateLegacyRule(rule, request);
  }

  /**
   * Legacy rule-type-specific evaluation (backward compatibility).
   * Mirrors the existing `evaluateRule` in `fraudRepo.ts`.
   */
  private evaluateLegacyRule(rule: FraudRule, request: FraudScreeningRequest): boolean {
    const conditions = rule.conditions as Record<string, unknown>;

    switch (rule.ruleType) {
      case 'amount':
        if (conditions.minAmount && (request.orderAmount ?? 0) < (conditions.minAmount as number)) return false;
        if (conditions.maxAmount && (request.orderAmount ?? 0) > (conditions.maxAmount as number)) return true;
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
          (request.orderAmount ?? 0) > ((conditions.threshold as number) || 500)
        )
          return true;
        if (
          conditions.guestCheckoutHighValue &&
          request.isGuestCheckout &&
          (request.orderAmount ?? 0) > ((conditions.threshold as number) || 300)
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
  private isHighRiskCountry(country?: string): boolean {
    if (!country) return false;
    const highRisk = ['XX', 'YY', 'ZZ']; // Placeholder — would be configurable
    return highRisk.includes(country);
  }

  /**
   * Convert the highest action and risk level to a screening decision.
   */
  private toDecision(highestAction: RuleAction, riskLevel: RiskLevel): ScreeningDecision {
    if (highestAction === 'block' || riskLevel === 'critical') return 'blocked';
    if (highestAction === 'review' || riskLevel === 'high') return 'review';
    if (highestAction === 'flag' || riskLevel === 'medium') return 'review';
    return 'approved';
  }

  /**
   * Convert a screening decision to a check status.
   */
  private toStatus(decision: ScreeningDecision): CheckStatus {
    switch (decision) {
      case 'approved':
        return 'passed';
      case 'review':
        return 'flagged';
      case 'blocked':
        return 'blocked';
    }
  }
}

// ============================================================================
// Helpers (mirrors fraudRepo for consistency)
// ============================================================================

function actionPriority(action: RuleAction): number {
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

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export const fraudScreeningService = new FraudScreeningService();
