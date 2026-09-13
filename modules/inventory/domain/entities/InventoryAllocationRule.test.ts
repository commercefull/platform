import { InventoryAllocationRule, type AllocationEvaluationContext } from './InventoryAllocationRule';

describe('InventoryAllocationRule domain entity', () => {
  const baseProps = {
    inventoryAllocationRuleId: 'r1',
    name: 'Standard Allocation',
    scope: 'global' as const,
    allocationStrategy: 'fifo' as const,
    reservationPolicy: 'immediate' as const,
    lowStockThreshold: 5,
    oversellBuffer: 0,
    allowBackorder: false,
    allowOversell: false,
    maxAllocationPerOrder: 0,
    priority: 0,
    isActive: true,
  };

  const context: AllocationEvaluationContext = {
    poolId: 'pool-1',
    productId: 'prod-1',
    categoryId: 'cat-1',
    availableStock: 100,
  };

  describe('isApplicable', () => {
    it('returns true for active global rule with no conditions', () => {
      const rule = new InventoryAllocationRule(baseProps);
      expect(rule.isApplicable(context)).toBe(true);
    });

    it('returns false for inactive rule', () => {
      const rule = new InventoryAllocationRule({ ...baseProps, isActive: false });
      expect(rule.isApplicable(context)).toBe(false);
    });

    it('returns false for pool-scoped rule when pool does not match', () => {
      const rule = new InventoryAllocationRule({ ...baseProps, scope: 'pool', poolId: 'pool-2' });
      expect(rule.isApplicable({ ...context, poolId: 'pool-1' })).toBe(false);
    });

    it('returns true for pool-scoped rule when pool matches', () => {
      const rule = new InventoryAllocationRule({ ...baseProps, scope: 'pool', poolId: 'pool-1' });
      expect(rule.isApplicable({ ...context, poolId: 'pool-1' })).toBe(true);
    });

    it('returns false for product-scoped rule when product does not match', () => {
      const rule = new InventoryAllocationRule({ ...baseProps, scope: 'product', productId: 'prod-2' });
      expect(rule.isApplicable({ ...context, productId: 'prod-1' })).toBe(false);
    });

    it('returns true for product-scoped rule when product matches', () => {
      const rule = new InventoryAllocationRule({ ...baseProps, scope: 'product', productId: 'prod-1' });
      expect(rule.isApplicable({ ...context, productId: 'prod-1' })).toBe(true);
    });

    it('returns false for category-scoped rule when category does not match', () => {
      const rule = new InventoryAllocationRule({ ...baseProps, scope: 'category', categoryId: 'cat-2' });
      expect(rule.isApplicable({ ...context, categoryId: 'cat-1' })).toBe(false);
    });

    it('returns true for category-scoped rule when category matches', () => {
      const rule = new InventoryAllocationRule({ ...baseProps, scope: 'category', categoryId: 'cat-1' });
      expect(rule.isApplicable({ ...context, categoryId: 'cat-1' })).toBe(true);
    });
  });

  describe('accessors', () => {
    it('exposes all props', () => {
      const rule = new InventoryAllocationRule({
        ...baseProps,
        allocationStrategy: 'nearest',
        reservationPolicy: 'deferred',
        lowStockThreshold: 10,
        oversellBuffer: 5,
        allowBackorder: true,
        allowOversell: true,
        maxAllocationPerOrder: 50,
      });
      expect(rule.id).toBe('r1');
      expect(rule.scope).toBe('global');
      expect(rule.allocationStrategy).toBe('nearest');
      expect(rule.reservationPolicy).toBe('deferred');
      expect(rule.lowStockThreshold).toBe(10);
      expect(rule.oversellBuffer).toBe(5);
      expect(rule.allowBackorder).toBe(true);
      expect(rule.allowOversell).toBe(true);
      expect(rule.maxAllocationPerOrder).toBe(50);
    });
  });
});
