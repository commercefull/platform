import { ReturnRule, type ReturnEvaluationContext } from './ReturnRule';

describe('ReturnRule domain entity', () => {
  const baseProps = {
    returnRuleId: 'r1',
    name: 'Standard Return Policy',
    scope: 'global' as const,
    customerPaysReturnShipping: false,
    autoApprove: false,
    requiresManualReview: false,
    requiresInspection: true,
    refundMethod: 'original' as const,
    priority: 0,
    isActive: true,
  };

  const context: ReturnEvaluationContext = {
    orderDate: new Date('2024-01-01'),
    returnDate: new Date('2024-01-15'),
  };

  describe('isApplicable', () => {
    it('returns true for active global rule with no conditions', () => {
      const rule = new ReturnRule(baseProps);
      expect(rule.isApplicable(context)).toBe(true);
    });

    it('returns false for inactive rule', () => {
      const rule = new ReturnRule({ ...baseProps, isActive: false });
      expect(rule.isApplicable(context)).toBe(false);
    });

    it('returns false for category-scoped rule when category does not match', () => {
      const rule = new ReturnRule({ ...baseProps, scope: 'category', categoryId: 'cat-1' });
      expect(rule.isApplicable({ ...context, categoryId: 'cat-2' })).toBe(false);
    });

    it('returns true for category-scoped rule when category matches', () => {
      const rule = new ReturnRule({ ...baseProps, scope: 'category', categoryId: 'cat-1' });
      expect(rule.isApplicable({ ...context, categoryId: 'cat-1' })).toBe(true);
    });

    it('returns false for product-scoped rule when product does not match', () => {
      const rule = new ReturnRule({ ...baseProps, scope: 'product', productId: 'prod-1' });
      expect(rule.isApplicable({ ...context, productId: 'prod-2' })).toBe(false);
    });

    it('returns true for product-scoped rule when product matches', () => {
      const rule = new ReturnRule({ ...baseProps, scope: 'product', productId: 'prod-1' });
      expect(rule.isApplicable({ ...context, productId: 'prod-1' })).toBe(true);
    });
  });

  describe('isWithinWindow', () => {
    it('returns true when within window', () => {
      const rule = new ReturnRule({ ...baseProps, returnWindowDays: 30 });
      // 14 days since order
      expect(rule.isWithinWindow(context)).toBe(true);
    });

    it('returns false when outside window', () => {
      const rule = new ReturnRule({ ...baseProps, returnWindowDays: 7 });
      // 14 days since order > 7 day window
      expect(rule.isWithinWindow(context)).toBe(false);
    });

    it('returns true when no window is set', () => {
      const rule = new ReturnRule(baseProps);
      expect(rule.isWithinWindow(context)).toBe(true);
    });
  });

  describe('accessors', () => {
    it('exposes all props', () => {
      const rule = new ReturnRule({
        ...baseProps,
        returnWindowDays: 30,
        restockingFeePercent: 10,
        restockingFeeFlatCents: 5,
        returnShippingCostCents: 9.99,
      });
      expect(rule.id).toBe('r1');
      expect(rule.scope).toBe('global');
      expect(rule.returnWindowDays).toBe(30);
      expect(rule.restockingFeePercent).toBe(10);
      expect(rule.restockingFeeFlatCents).toBe(5);
      expect(rule.returnShippingCostCents).toBe(9.99);
      expect(rule.customerPaysReturnShipping).toBe(false);
      expect(rule.autoApprove).toBe(false);
      expect(rule.requiresManualReview).toBe(false);
      expect(rule.requiresInspection).toBe(true);
      expect(rule.refundMethod).toBe('original');
    });

    it('defaults restockingFeePercent to 0', () => {
      const rule = new ReturnRule(baseProps);
      expect(rule.restockingFeePercent).toBe(0);
    });
  });
});
