import { ReturnRuleService } from './ReturnRuleService';
import { ReturnRule, type ReturnEvaluationContext } from '../entities/ReturnRule';

describe('ReturnRuleService', () => {
  let service: ReturnRuleService;

  beforeEach(() => {
    service = new ReturnRuleService();
  });

  const context: ReturnEvaluationContext = {
    orderDate: new Date('2024-01-01'),
    returnDate: new Date('2024-01-15'), // 14 days later
  };

  describe('evaluate — no rules', () => {
    it('returns conservative defaults when no rules apply', () => {
      const result = service.evaluate([], context);

      expect(result.applicableRule).toBeNull();
      expect(result.isWithinWindow).toBe(true); // 14 <= 30 default
      expect(result.daysSinceOrder).toBe(14);
      expect(result.restockingFeePercent).toBe(0);
      expect(result.autoApprove).toBe(false);
      expect(result.requiresManualReview).toBe(true);
      expect(result.requiresInspection).toBe(true);
      expect(result.refundMethod).toBe('original');
    });
  });

  describe('evaluate — global rule', () => {
    it('applies a global rule', () => {
      const rule = new ReturnRule({
        returnRuleId: 'r1',
        name: 'Standard',
        scope: 'global',
        returnWindowDays: 30,
        restockingFeePercent: 10,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], context);

      expect(result.applicableRule).toBe(rule);
      expect(result.isWithinWindow).toBe(true);
      expect(result.restockingFeePercent).toBe(10);
    });

    it('returns isWithinWindow=false when outside window', () => {
      const rule = new ReturnRule({
        returnRuleId: 'r1',
        name: 'Strict',
        scope: 'global',
        returnWindowDays: 7,
        customerPaysReturnShipping: true,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], context);

      expect(result.isWithinWindow).toBe(false); // 14 > 7
    });
  });

  describe('evaluate — specificity resolution', () => {
    it('prefers product-scoped rule over category-scoped rule', () => {
      const globalRule = new ReturnRule({
        returnRuleId: 'r1',
        name: 'Global',
        scope: 'global',
        restockingFeePercent: 5,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 10,
        isActive: true,
      });
      const categoryRule = new ReturnRule({
        returnRuleId: 'r2',
        name: 'Category',
        scope: 'category',
        categoryId: 'cat-1',
        restockingFeePercent: 10,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 5,
        isActive: true,
      });
      const productRule = new ReturnRule({
        returnRuleId: 'r3',
        name: 'Product',
        scope: 'product',
        productId: 'prod-1',
        restockingFeePercent: 15,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 1,
        isActive: true,
      });

      const result = service.evaluate([globalRule, categoryRule, productRule], {
        ...context,
        categoryId: 'cat-1',
        productId: 'prod-1',
      });

      expect(result.applicableRule?.id).toBe('r3'); // Product-scoped wins
      expect(result.restockingFeePercent).toBe(15);
    });

    it('prefers category-scoped rule over global rule', () => {
      const globalRule = new ReturnRule({
        returnRuleId: 'r1',
        name: 'Global',
        scope: 'global',
        restockingFeePercent: 5,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 10,
        isActive: true,
      });
      const categoryRule = new ReturnRule({
        returnRuleId: 'r2',
        name: 'Category',
        scope: 'category',
        categoryId: 'cat-1',
        restockingFeePercent: 10,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 5,
        isActive: true,
      });

      const result = service.evaluate([globalRule, categoryRule], {
        ...context,
        categoryId: 'cat-1',
      });

      expect(result.applicableRule?.id).toBe('r2');
    });

    it('uses priority as tiebreaker within same scope', () => {
      const lowPriority = new ReturnRule({
        returnRuleId: 'r1',
        name: 'Low Priority',
        scope: 'global',
        restockingFeePercent: 5,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 1,
        isActive: true,
      });
      const highPriority = new ReturnRule({
        returnRuleId: 'r2',
        name: 'High Priority',
        scope: 'global',
        restockingFeePercent: 15,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 10,
        isActive: true,
      });

      const result = service.evaluate([lowPriority, highPriority], context);

      expect(result.applicableRule?.id).toBe('r2');
    });
  });

  describe('evaluate — auto-approve', () => {
    it('returns autoApprove=true when rule allows it', () => {
      const rule = new ReturnRule({
        returnRuleId: 'r1',
        name: 'Auto-Approve',
        scope: 'global',
        autoApprove: true,
        requiresManualReview: false,
        requiresInspection: false,
        customerPaysReturnShipping: false,
        refundMethod: 'storeCredit',
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], context);

      expect(result.autoApprove).toBe(true);
      expect(result.requiresInspection).toBe(false);
      expect(result.refundMethod).toBe('storeCredit');
    });
  });

  describe('computeRestockingFee', () => {
    it('computes percentage-based restocking fee', () => {
      const rule = new ReturnRule({
        returnRuleId: 'r1',
        name: '10% Restocking',
        scope: 'global',
        restockingFeePercent: 10,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], context);
      const fee = service.computeRestockingFee(result, 100);
      expect(fee).toBe(10); // 10% of 100
    });

    it('computes flat + percentage restocking fee', () => {
      const rule = new ReturnRule({
        returnRuleId: 'r1',
        name: 'Flat + Percent',
        scope: 'global',
        restockingFeePercent: 5,
        restockingFeeFlat: 2,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], context);
      const fee = service.computeRestockingFee(result, 100);
      expect(fee).toBe(7); // 5% of 100 + 2 flat = 7
    });

    it('caps restocking fee at refund amount', () => {
      const rule = new ReturnRule({
        returnRuleId: 'r1',
        name: 'High Fee',
        scope: 'global',
        restockingFeePercent: 50,
        restockingFeeFlat: 100,
        customerPaysReturnShipping: false,
        autoApprove: false,
        requiresManualReview: false,
        requiresInspection: true,
        refundMethod: 'original',
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], context);
      const fee = service.computeRestockingFee(result, 100);
      expect(fee).toBe(100); // Capped at refund amount
    });
  });
});
