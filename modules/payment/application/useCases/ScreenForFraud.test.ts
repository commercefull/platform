/**
 * Unit Tests for ScreenForFraudUseCase (Epic E)
 */

import { lazyMock } from '../../tests/testUtils';
import { ScreenForFraudUseCase } from './ScreenForFraud';
import type { FraudScreeningRepositoryPort } from '../../domain/repositories/FraudRepository';
import type { FraudRule } from '../../domain/entities/FraudRule';

describe('ScreenForFraudUseCase', () => {
  let useCase: ScreenForFraudUseCase;
  let fraudRepo: jest.Mocked<FraudScreeningRepositoryPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    fraudRepo = lazyMock<FraudScreeningRepositoryPort>();
    useCase = new ScreenForFraudUseCase(fraudRepo);
    fraudRepo.getRules.mockResolvedValue([]);
    fraudRepo.isBlacklisted.mockResolvedValue(false);
    fraudRepo.incrementRuleTrigger.mockResolvedValue(undefined);
  });

  describe('screen — no rules', () => {
    it('approves when no rules and no blacklist hits', async () => {
      const result = await useCase.execute({
        orderId: 'order1',
        orderAmountCents: 100,
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
      fraudRepo.isBlacklisted.mockImplementation(async type => type === 'ip');

      const result = await useCase.execute({
        ipAddress: '1.2.3.4',
        orderAmountCents: 100,
      });

      expect(result.decision).toBe('blocked');
      expect(result.riskScore).toBe(100);
      expect(result.riskLevel).toBe('critical');
      expect(result.triggeredRules).toHaveLength(1);
      expect(result.triggeredRules[0].ruleType).toBe('blacklist');
    });

    it('blocks when email is blacklisted', async () => {
      fraudRepo.isBlacklisted.mockImplementation(async type => type === 'email');

      const result = await useCase.execute({
        email: 'fraud@bad.com',
        orderAmountCents: 100,
      });

      expect(result.decision).toBe('blocked');
    });

    it('blocks when card BIN is blacklisted', async () => {
      fraudRepo.isBlacklisted.mockImplementation(async type => type === 'card_bin');

      const result = await useCase.execute({
        cardBin: '411111',
        orderAmountCents: 100,
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
        conditions: [{ attribute: 'orderAmountCents', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
        action: 'review',
        riskScore: 50,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        orderAmountCents: 600,
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
        conditions: [{ attribute: 'orderAmountCents', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
        action: 'review',
        riskScore: 50,
        priority: 10,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        orderAmountCents: 100,
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
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        billingCountry: 'XX',
        orderAmountCents: 100,
      });

      expect(result.decision).toBe('review');
      expect(result.triggeredRules).toHaveLength(1);
    });
  });

  describe('screen — legacy rule evaluation', () => {
    it('evaluates amountCents rules with legacy conditions', async () => {
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
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        orderAmountCents: 600,
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
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        previousOrders: 6,
        orderAmountCents: 100,
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
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        isFirstOrder: true,
        orderAmountCents: 600,
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
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        billingCountry: 'XX',
        orderAmountCents: 100,
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
        conditions: [{ attribute: 'orderAmountCents', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
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
      fraudRepo.getRules.mockResolvedValue([rule1, rule2]);

      const result = await useCase.execute({
        orderAmountCents: 600,
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
        conditions: [{ attribute: 'orderAmountCents', operator: 'gt', value: 500 }] as unknown as Record<string, unknown>,
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
      fraudRepo.getRules.mockResolvedValue([rule1, rule2]);

      const result = await useCase.execute({
        orderAmountCents: 600,
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
      fraudRepo.getRules.mockResolvedValue([rule]);

      const result = await useCase.execute({
        avsMatch: false,
        orderAmountCents: 100,
      });

      expect(result.decision).toBe('review');
    });
  });
});
