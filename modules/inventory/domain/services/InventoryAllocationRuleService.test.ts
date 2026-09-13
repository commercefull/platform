import { InventoryAllocationRuleService } from './InventoryAllocationRuleService';
import { InventoryAllocationRule, type AllocationEvaluationContext } from '../entities/InventoryAllocationRule';

describe('InventoryAllocationRuleService', () => {
  let service: InventoryAllocationRuleService;

  beforeEach(() => {
    service = new InventoryAllocationRuleService();
  });

  const context: AllocationEvaluationContext = {
    poolId: 'pool-1',
    productId: 'prod-1',
    categoryId: 'cat-1',
    availableStock: 100,
  };

  describe('evaluate — no rules', () => {
    it('returns conservative defaults when no rules apply', () => {
      const result = service.evaluate([], context);

      expect(result.applicableRule).toBeNull();
      expect(result.allocationStrategy).toBe('fifo');
      expect(result.reservationPolicy).toBe('immediate');
      expect(result.allowBackorder).toBe(false);
      expect(result.allowOversell).toBe(false);
      expect(result.effectiveAvailable).toBe(100);
    });
  });

  describe('evaluate — global rule', () => {
    it('applies a global rule', () => {
      const rule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Global FIFO',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 5,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], context);

      expect(result.applicableRule).toBe(rule);
      expect(result.allocationStrategy).toBe('fifo');
      expect(result.lowStockThreshold).toBe(5);
    });
  });

  describe('evaluate — specificity resolution', () => {
    it('prefers product-scoped rule over category-scoped rule', () => {
      const globalRule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Global',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 10,
        isActive: true,
      });
      const categoryRule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r2',
        name: 'Category',
        scope: 'category',
        categoryId: 'cat-1',
        allocationStrategy: 'nearest',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 5,
        isActive: true,
      });
      const productRule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r3',
        name: 'Product',
        scope: 'product',
        productId: 'prod-1',
        allocationStrategy: 'lifo',
        reservationPolicy: 'deferred',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 1,
        isActive: true,
      });

      const result = service.evaluate([globalRule, categoryRule, productRule], context);

      expect(result.applicableRule?.id).toBe('r3');
      expect(result.allocationStrategy).toBe('lifo');
    });

    it('prefers pool-scoped rule over global rule', () => {
      const globalRule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Global',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 10,
        isActive: true,
      });
      const poolRule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r2',
        name: 'Pool',
        scope: 'pool',
        poolId: 'pool-1',
        allocationStrategy: 'even_split',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 5,
        isActive: true,
      });

      const result = service.evaluate([globalRule, poolRule], context);

      expect(result.applicableRule?.id).toBe('r2');
    });

    it('uses priority as tiebreaker within same scope', () => {
      const lowPriority = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Low',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 1,
        isActive: true,
      });
      const highPriority = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r2',
        name: 'High',
        scope: 'global',
        allocationStrategy: 'nearest',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 10,
        isActive: true,
      });

      const result = service.evaluate([lowPriority, highPriority], context);

      expect(result.applicableRule?.id).toBe('r2');
    });
  });

  describe('evaluate — oversell and backorder', () => {
    it('adds oversell buffer to effective available when allowOversell is true', () => {
      const rule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Oversell',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 20,
        allowBackorder: false,
        allowOversell: true,
        maxAllocationPerOrder: 0,
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], { ...context, availableStock: 100 });

      expect(result.effectiveAvailable).toBe(120); // 100 + 20 buffer
    });

    it('does not add oversell buffer when allowOversell is false', () => {
      const rule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'No Oversell',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 20,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], { ...context, availableStock: 100 });

      expect(result.effectiveAvailable).toBe(100);
    });
  });

  describe('canAllocate', () => {
    it('returns true when effective available covers requested quantity', () => {
      const rule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Standard',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], { ...context, availableStock: 100 });
      expect(service.canAllocate(result, 50)).toBe(true);
    });

    it('returns false when insufficient stock and no backorder', () => {
      const rule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Standard',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], { ...context, availableStock: 10 });
      expect(service.canAllocate(result, 50)).toBe(false);
    });

    it('returns true when insufficient stock but backorder is allowed', () => {
      const rule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Backorder',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: true,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], { ...context, availableStock: 10 });
      expect(service.canAllocate(result, 50)).toBe(true);
    });

    it('returns false when requested quantity exceeds maxAllocationPerOrder', () => {
      const rule = new InventoryAllocationRule({
        inventoryAllocationRuleId: 'r1',
        name: 'Max Per Order',
        scope: 'global',
        allocationStrategy: 'fifo',
        reservationPolicy: 'immediate',
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 25,
        priority: 0,
        isActive: true,
      });

      const result = service.evaluate([rule], { ...context, availableStock: 100 });
      expect(service.canAllocate(result, 50)).toBe(false);
      expect(service.canAllocate(result, 25)).toBe(true);
    });
  });
});
