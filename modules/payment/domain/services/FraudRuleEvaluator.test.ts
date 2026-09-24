/**
 * Unit Tests for FraudRuleEvaluator (domain service)
 *
 * Pure functions — no mocks needed.
 */

import type { FraudRule } from '../entities/FraudRule';
import {
  buildFraudConditionContext,
  fraudRuleMatches,
  isHighRiskCountry,
  actionPriority,
  getRiskLevel,
  toScreeningDecision,
  toCheckStatus,
  type FraudScreeningRequest,
} from './FraudRuleEvaluator';

function createRule(overrides: Partial<FraudRule> = {}): FraudRule {
  return {
    fraudRuleId: 'r1',
    name: 'Rule',
    ruleType: 'amount',
    entityType: 'order',
    conditions: {},
    action: 'review',
    riskScore: 50,
    priority: 10,
    isActive: true,
    triggerCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const request: FraudScreeningRequest = {
  orderAmountCents: 600,
  currency: 'USD',
  billingCountry: 'US',
  shippingCountry: 'US',
};

describe('buildFraudConditionContext', () => {
  it('should map request fields and derive signal attributes', () => {
    const context = buildFraudConditionContext({
      ...request,
      billingCountry: 'US',
      shippingCountry: 'CA',
      isFirstOrder: true,
      previousOrders: 3,
      deviceFingerprint: { isProxy: true },
    });

    expect(context.orderAmountCents).toBe(600);
    expect(context.addressMismatch).toBe(true);
    expect(context.isFirstOrder).toBe(true);
    expect(context.previousOrders).toBe(3);
    expect(context.isProxy).toBe(true);
  });

  it('should derive cardBinMismatch only when all card fields are present', () => {
    expect(
      buildFraudConditionContext({ cardBin: '411111', cardCountry: 'US', billingCountry: 'FR' }).cardBinMismatch,
    ).toBe(true);
    expect(buildFraudConditionContext({ cardBin: '411111' }).cardBinMismatch).toBe(false);
  });
});

describe('fraudRuleMatches', () => {
  it('should use the shared matcher when conditions is an array', () => {
    const rule = createRule({
      conditions: [{ attribute: 'orderAmountCents', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
    });
    const context = buildFraudConditionContext(request);
    expect(fraudRuleMatches(rule, request, context)).toBe(true);
  });

  it('should fall back to legacy amount rules', () => {
    const rule = createRule({ ruleType: 'amount', conditions: { maxAmount: 500 } });
    expect(fraudRuleMatches(rule, request, {})).toBe(true);
    expect(fraudRuleMatches(rule, { ...request, orderAmountCents: 100 }, {})).toBe(false);
  });

  it('should evaluate legacy velocity rules', () => {
    const rule = createRule({ ruleType: 'velocity', conditions: { maxOrdersPerDay: 5 } });
    expect(fraudRuleMatches(rule, { ...request, previousOrders: 6 }, {})).toBe(true);
    expect(fraudRuleMatches(rule, { ...request, previousOrders: 2 }, {})).toBe(false);
  });

  it('should evaluate legacy location rules', () => {
    const rule = createRule({ ruleType: 'location', conditions: { highRiskCountries: ['XX'] } });
    expect(fraudRuleMatches(rule, { ...request, billingCountry: 'XX' }, {})).toBe(true);
    expect(fraudRuleMatches(rule, request, {})).toBe(false);
  });

  it('should evaluate legacy pattern rules', () => {
    const rule = createRule({ ruleType: 'pattern', conditions: { firstOrderHighValue: true, threshold: 500 } });
    expect(fraudRuleMatches(rule, { ...request, isFirstOrder: true }, {})).toBe(true);
    expect(fraudRuleMatches(rule, { ...request, isFirstOrder: false }, {})).toBe(false);
  });

  it('should evaluate legacy device rules', () => {
    const rule = createRule({ ruleType: 'device', conditions: { blockProxy: true } });
    expect(fraudRuleMatches(rule, { ...request, deviceFingerprint: { isProxy: true } }, {})).toBe(true);
    expect(fraudRuleMatches(rule, request, {})).toBe(false);
  });

  it('should return false for unknown legacy rule types', () => {
    const rule = createRule({ ruleType: 'custom', conditions: {} });
    expect(fraudRuleMatches(rule, request, {})).toBe(false);
  });
});

describe('decision helpers', () => {
  it('should flag high-risk countries', () => {
    expect(isHighRiskCountry('XX')).toBe(true);
    expect(isHighRiskCountry('US')).toBe(false);
    expect(isHighRiskCountry(undefined)).toBe(false);
  });

  it('should rank actions by priority', () => {
    expect(actionPriority('block')).toBeGreaterThan(actionPriority('review'));
    expect(actionPriority('review')).toBeGreaterThan(actionPriority('flag'));
    expect(actionPriority('flag')).toBeGreaterThan(actionPriority('allow'));
  });

  it('should bucket risk scores into levels', () => {
    expect(getRiskLevel(0)).toBe('low');
    expect(getRiskLevel(30)).toBe('medium');
    expect(getRiskLevel(60)).toBe('high');
    expect(getRiskLevel(80)).toBe('critical');
  });

  it('should derive the screening decision from action and risk level', () => {
    expect(toScreeningDecision('block', 'low')).toBe('blocked');
    expect(toScreeningDecision('allow', 'critical')).toBe('blocked');
    expect(toScreeningDecision('review', 'low')).toBe('review');
    expect(toScreeningDecision('flag', 'low')).toBe('review');
    expect(toScreeningDecision('allow', 'high')).toBe('review');
    expect(toScreeningDecision('allow', 'low')).toBe('approved');
  });

  it('should map decisions to check statuses', () => {
    expect(toCheckStatus('approved')).toBe('passed');
    expect(toCheckStatus('review')).toBe('flagged');
    expect(toCheckStatus('blocked')).toBe('blocked');
  });
});
