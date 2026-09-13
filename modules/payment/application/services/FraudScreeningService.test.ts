/**
 * Unit Tests for FraudScreeningService (Epic E)
 */

jest.mock('../../infrastructure/repositories/fraudRepo', () => ({
  getRules: jest.fn(),
  isBlacklisted: jest.fn(),
  incrementRuleTrigger: jest.fn().mockResolvedValue(undefined),
}));

import { FraudScreeningService } from './FraudScreeningService';
import * as fraudRepo from '../../infrastructure/repositories/fraudRepo';
import type { FraudRule } from '../../infrastructure/repositories/fraudRepo';

describe('FraudScreeningService', () => {
  let service: FraudScreeningService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FraudScreeningService();
    jest.mocked(fraudRepo.getRules).mockResolvedValue([]);
    jest.mocked(fraudRepo.isBlacklisted).mockResolvedValue(false);
  });

  describe('screen — no rules', () => {
    it('approves when no rules and no blacklist hits', async () => {
      const result = await service.screen({
        orderId: 'order1',
        orderAmount: 100,
        billingCountry: 'US',
      });

      expect(result.decision).toBe('approved');
      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('low');
      expect(result.triggeredRules).toEqual([]);
    });
  });

  describe('screen — blacklist', () => {
    it('blocks when IP is blacklisted', async () => {
      jest.mocked(fraudRepo.isBlacklisted).mockImplementation(async type => type === 'ip');

      const result = await service.screen({
        ipAddress: '1.2.3.4',
        orderAmount: 100,
      });

      expect(result.decision).toBe('blocked');
      expect(result.riskScore).toBe(100);
      expect(result.riskLevel).toBe('critical');
      expect(result.triggeredRules).toHaveLength(1);
      expect(result.triggeredRules[0].ruleType).toBe('blacklist');
    });

    it('blocks when email is blacklisted', async () => {
      jest.mocked(fraudRepo.isBlacklisted).mockImplementation(async type => type === 'email');

      const result = await service.screen({
        email: 'fraud@bad.com',
        orderAmount: 100,
      });

      expect(result.decision).toBe('blocked');
    });

    it('blocks when card BIN is blacklisted', async () => {
      jest.mocked(fraudRepo.isBlacklisted).mockImplementation(async type => type === 'card_bin');

      const result = await service.screen({
        cardBin: '411111',
        orderAmount: 100,
      });

      expect(result.decision).toBe('blocked');
    });
  });

  describe('screen — shared condition matcher', () => {
    it('triggers a rule with shared AttributeCondition array', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'High Amount Rule',
        ruleType: 'amount',
        entityType: 'order',
        conditions: [{ attribute: 'orderAmount', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
        action: 'review',
        riskScore: 50,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        orderAmount: 600,
        billingCountry: 'US',
      });

      expect(result.decision).toBe('review');
      expect(result.riskScore).toBe(50);
      expect(result.triggeredRules).toHaveLength(1);
      expect(result.triggeredRules[0].fraudRuleId).toBe('r1');
    });

    it('does not trigger a rule when conditions do not match', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'High Amount Rule',
        ruleType: 'amount',
        entityType: 'order',
        conditions: [{ attribute: 'orderAmount', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
        action: 'review',
        riskScore: 50,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        orderAmount: 100,
        billingCountry: 'US',
      });

      expect(result.decision).toBe('approved');
      expect(result.triggeredRules).toEqual([]);
    });

    it('supports "in" operator for country matching', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'High Risk Country',
        ruleType: 'location',
        entityType: 'order',
        conditions: [{ attribute: 'billingCountry', operator: 'in', value: ['XX', 'YY'] }] as unknown as Record<string, unknown>,
        action: 'review',
        riskScore: 60,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        billingCountry: 'XX',
        orderAmount: 100,
      });

      expect(result.decision).toBe('review');
      expect(result.triggeredRules).toHaveLength(1);
    });
  });

  describe('screen — legacy rule evaluation', () => {
    it('evaluates amount rules with legacy conditions', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'High Amount',
        ruleType: 'amount',
        entityType: 'order',
        conditions: { maxAmount: 500 },
        action: 'review',
        riskScore: 40,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        orderAmount: 600,
      });

      expect(result.decision).toBe('review');
      expect(result.triggeredRules).toHaveLength(1);
    });

    it('evaluates velocity rules with legacy conditions', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'Velocity Check',
        ruleType: 'velocity',
        entityType: 'order',
        conditions: { maxOrdersPerDay: 5 },
        action: 'review',
        riskScore: 30,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        previousOrders: 6,
        orderAmount: 100,
      });

      expect(result.decision).toBe('review');
    });

    it('evaluates pattern rules — first order high value', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'First Order High Value',
        ruleType: 'pattern',
        entityType: 'order',
        conditions: { firstOrderHighValue: true, threshold: 500 },
        action: 'review',
        riskScore: 35,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        isFirstOrder: true,
        orderAmount: 600,
      });

      expect(result.decision).toBe('review');
    });

    it('evaluates location rules — high risk countries', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'High Risk Country',
        ruleType: 'location',
        entityType: 'order',
        conditions: { highRiskCountries: ['XX', 'YY'] },
        action: 'block',
        riskScore: 80,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        billingCountry: 'XX',
        orderAmount: 100,
      });

      expect(result.decision).toBe('blocked');
    });
  });

  describe('screen — multiple rules', () => {
    it('sums risk scores from multiple triggered rules', async () => {
      const rule1: FraudRule = {
        fraudRuleId: 'r1',
        name: 'Rule 1',
        ruleType: 'amount',
        entityType: 'order',
        conditions: [{ attribute: 'orderAmount', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
        action: 'flag',
        riskScore: 30,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const rule2: FraudRule = {
        fraudRuleId: 'r2',
        name: 'Rule 2',
        ruleType: 'pattern',
        entityType: 'order',
        conditions: [{ attribute: 'isFirstOrder', operator: 'eq', value: true }] as unknown as Record<string, unknown>,
        action: 'flag',
        riskScore: 20,
        priority: 5,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule1, rule2]);

      const result = await service.screen({
        orderAmount: 600,
        isFirstOrder: true,
      });

      expect(result.riskScore).toBe(50);
      expect(result.riskLevel).toBe('medium');
      expect(result.triggeredRules).toHaveLength(2);
      expect(result.decision).toBe('review');
    });

    it('caps risk score at 100', async () => {
      const rule1: FraudRule = {
        fraudRuleId: 'r1',
        name: 'Rule 1',
        ruleType: 'amount',
        entityType: 'order',
        conditions: [{ attribute: 'orderAmount', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
        action: 'flag',
        riskScore: 60,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const rule2: FraudRule = {
        fraudRuleId: 'r2',
        name: 'Rule 2',
        ruleType: 'pattern',
        entityType: 'order',
        conditions: [{ attribute: 'isFirstOrder', operator: 'eq', value: true }] as unknown as Record<string, unknown>,
        action: 'flag',
        riskScore: 60,
        priority: 5,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule1, rule2]);

      const result = await service.screen({
        orderAmount: 600,
        isFirstOrder: true,
      });

      expect(result.riskScore).toBe(100);
    });
  });

  describe('screen — AVS/CVV signals', () => {
    it('triggers rule when AVS does not match', async () => {
      const rule: FraudRule = {
        fraudRuleId: 'r1',
        name: 'AVS Mismatch',
        ruleType: 'custom',
        entityType: 'order',
        conditions: [{ attribute: 'avsMatch', operator: 'eq', value: false }] as unknown as Record<string, unknown>,
        action: 'review',
        riskScore: 40,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.mocked(fraudRepo.getRules).mockResolvedValue([rule]);

      const result = await service.screen({
        avsMatch: false,
        orderAmount: 100,
      });

      expect(result.decision).toBe('review');
    });
  });
});
