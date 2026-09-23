jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import {
  lazyMock,
  createPromotion,
  createPromotionRule,
  createPromotionAction,
} from '../../tests/testUtils';
import type { PromotionRepository } from '../../domain/repositories/PromotionRepository';
import { PromotionEvaluationService, PromotionEvaluationContext } from './PromotionEvaluationService';

type PromotionsPort = Pick<
  PromotionRepository,
  'findActive' | 'findRulesByPromotionId' | 'findActionsByPromotionId'
>;

const baseContext: PromotionEvaluationContext = {
  items: [
    { productId: 'p1', name: 'Widget', quantity: 2, unitPrice: 50, categoryId: 'cat1' },
    { productId: 'p2', name: 'Gadget', quantity: 1, unitPrice: 100, categoryId: 'cat2' },
  ],
  subtotal: 200,
  shippingAmount: 15,
  currency: 'USD',
};

const activePromotion = createPromotion({
  promotionId: 'promo1',
  name: '20% Off',
  scope: 'cart',
  isActive: true,
  status: 'active',
  priority: 10,
  isExclusive: false,
  usageCount: 0,
  maxUsage: null,
  minOrderAmount: null,
  maxDiscountAmount: null,
  stackability: undefined,
});

describe('PromotionEvaluationService', () => {
  let service: PromotionEvaluationService;
  let promotionsRepo: jest.Mocked<PromotionsPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    promotionsRepo = lazyMock<PromotionsPort>();
    service = new PromotionEvaluationService(promotionsRepo);
  });

  it('should return empty result when no active promotions', async () => {
    promotionsRepo.findActive.mockResolvedValue([]);
    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should apply percentage discount on cart subtotal', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 20, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(40);
    expect(result.appliedPromotions).toHaveLength(1);
  });

  it('should apply fixed amount discount', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByAmount', value: 25, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(25);
  });

  it('should cap fixed discount at subtotal', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByAmount', value: 500, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(200);
  });

  it('should apply line-item percentage discount for specific products', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 50, targetIds: ['p1'] }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(50);
    expect(result.lineItemDiscounts).toHaveLength(1);
  });

  it('should apply line-item fixed discount for specific products', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByAmount', value: 30, targetIds: ['p1'] }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(30);
    expect(result.lineItemDiscounts[0].productId).toBe('p1');
  });

  it('should cap line-item fixed discount at item total', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByAmount', value: 500, targetIds: ['p1'] }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(100);
  });

  it('should apply shipping discount alongside cart discount', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
      createPromotionAction({ actionType: 'discountShipping', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.shippingDiscountAmount).toBe(10);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should cap shipping discount at shipping amount', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
      createPromotionAction({ actionType: 'discountShipping', value: 50, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.shippingDiscountAmount).toBe(15);
  });

  it('should add free items', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'freeItem', value: 'p3', targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.freeItems).toHaveLength(1);
    expect(result.freeItems[0].productId).toBe('p3');
  });

  it('should set freeShipping for shipping scope', async () => {
    promotionsRepo.findActive.mockResolvedValue([{ ...activePromotion, scope: 'shipping' }]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.freeShipping).toBe(true);
  });

  it('should apply coupon code promotions first', async () => {
    const couponPromo = { ...activePromotion, promotionId: 'coupon1', name: 'SAVE10', code: 'SAVE10', priority: 5 };
    const autoPromo = { ...activePromotion, promotionId: 'auto1', name: 'Auto 5%', priority: 1 };
    promotionsRepo.findActive.mockResolvedValue([couponPromo, autoPromo]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate({ ...baseContext, couponCode: 'save10' });
    expect(result.appliedPromotions).toHaveLength(2);
    expect(result.appliedPromotions[0].promotionId).toBe('coupon1');
  });

  it('should stop after exclusive promotion', async () => {
    const exclusivePromo = { ...activePromotion, isExclusive: true, priority: 10 };
    const otherPromo = { ...activePromotion, promotionId: 'promo2', priority: 5 };
    promotionsRepo.findActive.mockResolvedValue([exclusivePromo, otherPromo]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 20, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(1);
  });

  it('should skip inactive promotions', async () => {
    promotionsRepo.findActive.mockResolvedValue([{ ...activePromotion, isActive: false }]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should skip promotions with status != active', async () => {
    promotionsRepo.findActive.mockResolvedValue([{ ...activePromotion, status: 'paused' }]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should skip promotions at max usage', async () => {
    promotionsRepo.findActive.mockResolvedValue([{ ...activePromotion, maxUsage: 5, usageCount: 5 }]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should skip promotions below minOrderAmount', async () => {
    promotionsRepo.findActive.mockResolvedValue([{ ...activePromotion, minOrderAmount: '500' }]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should evaluate cartTotal rule with >= operator', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'cartTotal', operator: '>=', value: 150 }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should fail cartTotal rule when below threshold', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'cartTotal', operator: '>=', value: 500 }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should evaluate itemQuantity rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'itemQuantity', operator: '>=', value: 3 }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate productCategory rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'productCategory', operator: '=', value: ['cat1'] }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should fail productCategory rule when no match', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'productCategory', operator: '=', value: ['cat99'] }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should evaluate customerGroup rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'customerGroup', operator: '=', value: ['vip'] }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate({ ...baseContext, customerGroup: 'vip' });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should fail customerGroup rule when no group', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'customerGroup', operator: '=', value: ['vip'] }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should evaluate firstOrder rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'firstOrder', operator: '=', value: true }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate({ ...baseContext, isFirstOrder: true });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate shippingMethod rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'shippingMethod', operator: '=', value: ['sm1'] }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate({ ...baseContext, shippingMethodId: 'sm1' });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate paymentMethod rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'paymentMethod', operator: '=', value: ['pm1'] }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate({ ...baseContext, paymentMethodId: 'pm1' });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate dateRange rule', async () => {
    const now = new Date();
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'dateRange', operator: '=', value: { start: now.toISOString(), end: new Date(now.getTime() + 86400000).toISOString() } }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate dayOfWeek rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'dayOfWeek', operator: '=', value: [new Date().getDay()] }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate timeOfDay rule', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'timeOfDay', operator: '=', value: { startHour: 0, endHour: 24 } }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should cap total discount at maxDiscountAmount', async () => {
    promotionsRepo.findActive.mockResolvedValue([{ ...activePromotion, maxDiscountAmount: '30' }]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 50, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(30);
  });

  it('should cap total discount at subtotal', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 200, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    promotionsRepo.findActive.mockRejectedValue(new Error('DB error'));
    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should pass when no rules (always applicable)', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should compare with > operator', async () => {
    promotionsRepo.findActive.mockResolvedValue([activePromotion]);
    promotionsRepo.findRulesByPromotionId.mockResolvedValue([
      createPromotionRule({ condition: 'cartTotal', operator: '>', value: 150 }),
    ]);
    promotionsRepo.findActionsByPromotionId.mockResolvedValue([
      createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should handle empty items', async () => {
    promotionsRepo.findActive.mockResolvedValue([]);
    const result = await service.evaluate({ items: [], subtotal: 0, shippingAmount: 0, currency: 'USD' });
    expect(result.totalDiscountAmount).toBe(0);
  });

  // ========================================================================
  // Epic C: Stackability enum + TieredDiscount + FreeGift
  // ========================================================================

  describe('Epic C — stackability enum', () => {
    it('should apply two stackable promotions and sum discounts', async () => {
      const promoA = { ...activePromotion, promotionId: 'a', stackability: 'stackable' as const, priority: 10 };
      const promoB = { ...activePromotion, promotionId: 'b', stackability: 'stackable' as const, priority: 5 };
      promotionsRepo.findActive.mockResolvedValue([promoA, promoB]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext);
      expect(result.appliedPromotions).toHaveLength(2);
      expect(result.totalDiscountAmount).toBe(40); // 10% of 200 twice
    });

    it('should block later stackable promotion when exclusive applies (via stackability field)', async () => {
      const exclusivePromo = { ...activePromotion, promotionId: 'exc', stackability: 'exclusive' as const, priority: 10 };
      const stackablePromo = { ...activePromotion, promotionId: 'stk', stackability: 'stackable' as const, priority: 5 };
      promotionsRepo.findActive.mockResolvedValue([exclusivePromo, stackablePromo]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'discountByPercentage', value: 20, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext);
      expect(result.appliedPromotions).toHaveLength(1);
      expect(result.appliedPromotions[0].promotionId).toBe('exc');
    });

    it('should drop none-stacked promotion when stackable present', async () => {
      const nonePromo = { ...activePromotion, promotionId: 'none', stackability: 'none' as const, priority: 10 };
      const stackablePromo = { ...activePromotion, promotionId: 'stk', stackability: 'stackable' as const, priority: 5 };
      promotionsRepo.findActive.mockResolvedValue([nonePromo, stackablePromo]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'discountByPercentage', value: 10, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext);
      expect(result.appliedPromotions).toHaveLength(1);
      expect(result.appliedPromotions[0].promotionId).toBe('stk');
    });

    it('should fall back to isExclusive when stackability is missing (backward compat)', async () => {
      const exclusivePromo = createPromotion({ ...activePromotion, isExclusive: true, stackability: undefined, priority: 10 });
      const stackablePromo = createPromotion({ ...activePromotion, promotionId: 'stk', isExclusive: false, stackability: undefined, priority: 5 });
      promotionsRepo.findActive.mockResolvedValue([exclusivePromo, stackablePromo]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'discountByPercentage', value: 20, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext);
      expect(result.appliedPromotions).toHaveLength(1);
      expect(result.appliedPromotions[0].promotionId).toBe('promo1');
    });
  });

  describe('Epic C — discountByTier action', () => {
    it('should pick the correct tier by quantity', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({
          actionType: 'discountByTier',
          value: [
            { min: 1, max: 2, percentage: 5 },
            { min: 3, max: 5, percentage: 10 },
            { min: 6, percentage: 15 },
          ],
          targetIds: null,
        }),
      ]);

      // baseContext has 3 items (qty 2 + 1 = 3 total) → tier 2 (10%)
      const result = await service.evaluate(baseContext);
      expect(result.totalDiscountAmount).toBe(20); // 10% of 200
    });

    it('should pick the correct tier at boundary quantity', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({
          actionType: 'discountByTier',
          value: [
            { min: 1, max: 2, percentage: 5 },
            { min: 3, max: 5, percentage: 10 },
          ],
          targetIds: null,
        }),
      ]);

      // 3 items total → boundary at min=3 → tier 2 (10%)
      const result = await service.evaluate(baseContext);
      expect(result.totalDiscountAmount).toBe(20);
    });

    it('should fall back to subtotal-based tiering when quantity tier does not match', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({
          actionType: 'discountByTier',
          value: [
            { min: 100, max: 199, percentage: 5 },
            { min: 200, percentage: 15 },
          ],
          targetIds: null,
        }),
      ]);

      // qty=3 doesn't match any quantity tier (max is 199), subtotal=200 matches tier 2
      const result = await service.evaluate(baseContext);
      expect(result.totalDiscountAmount).toBe(30); // 15% of 200
    });

    it('should apply tiered amount discount', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({
          actionType: 'discountByTier',
          value: [{ min: 1, amount: 30 }],
          targetIds: null,
        }),
      ]);

      const result = await service.evaluate(baseContext);
      expect(result.totalDiscountAmount).toBe(30);
    });

    it('should handle empty tiers array gracefully', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'discountByTier', value: [], targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext);
      expect(result.totalDiscountAmount).toBe(0);
    });
  });

  describe('Epic C — freeGift action', () => {
    it('should add free gift when no eligibility conditions', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'freeGift', value: { productId: 'gift1', quantity: 2 }, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext);
      expect(result.freeItems).toHaveLength(1);
      expect(result.freeItems[0].productId).toBe('gift1');
      expect(result.freeItems[0].quantity).toBe(2);
    });

    it('should not add free gift when minCartTotal not met', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'freeGift', value: { productId: 'gift1', minCartTotal: 500 }, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext); // subtotal 200 < 500
      expect(result.freeItems).toHaveLength(0);
    });

    it('should not add free gift when minQuantity not met', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'freeGift', value: { productId: 'gift1', minQuantity: 10 }, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext); // qty 3 < 10
      expect(result.freeItems).toHaveLength(0);
    });

    it('should add free gift when eligibility conditions met', async () => {
      promotionsRepo.findActive.mockResolvedValue([activePromotion]);
      promotionsRepo.findRulesByPromotionId.mockResolvedValue([]);
      promotionsRepo.findActionsByPromotionId.mockResolvedValue([
        createPromotionAction({ actionType: 'freeGift', value: { productId: 'gift1', minCartTotal: 100, minQuantity: 2 }, targetIds: null }),
      ]);

      const result = await service.evaluate(baseContext); // subtotal 200 >= 100, qty 3 >= 2
      expect(result.freeItems).toHaveLength(1);
      expect(result.freeItems[0].productId).toBe('gift1');
    });
  });
});
