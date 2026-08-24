jest.mock('../../infrastructure/repositories/PromotionRuleRepository', () => ({
  __esModule: true,
  default: {
    promotions: {
      findActive: jest.fn(),
      findRulesByPromotionId: jest.fn(),
      findActionsByPromotionId: jest.fn(),
    },
  },
}));

jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';
import { PromotionEvaluationService, PromotionEvaluationContext } from './PromotionEvaluationService';

const baseContext: PromotionEvaluationContext = {
  items: [
    { productId: 'p1', name: 'Widget', quantity: 2, unitPrice: 50, categoryId: 'cat1' },
    { productId: 'p2', name: 'Gadget', quantity: 1, unitPrice: 100, categoryId: 'cat2' },
  ],
  subtotal: 200,
  shippingAmount: 15,
  currency: 'USD',
};

const activePromotion = {
  promotionId: 'promo1', name: '20% Off', scope: 'cart', isActive: true, status: 'active',
  priority: 10, isExclusive: false, usageCount: 0, maxUsage: null,
  minOrderAmount: null, maxDiscountAmount: null, code: null,
};

describe('PromotionEvaluationService', () => {
  let service: PromotionEvaluationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PromotionEvaluationService();
  });

  it('should return empty result when no active promotions', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([]);
    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should apply percentage discount on cart subtotal', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 20, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(40);
    expect(result.appliedPromotions).toHaveLength(1);
  });

  it('should apply fixed amount discount', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByAmount', value: 25, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(25);
  });

  it('should cap fixed discount at subtotal', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByAmount', value: 500, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(200);
  });

  it('should apply line-item percentage discount for specific products', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 50, targetIds: ['p1'] },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(50);
    expect(result.lineItemDiscounts).toHaveLength(1);
  });

  it('should apply line-item fixed discount for specific products', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByAmount', value: 30, targetIds: ['p1'] },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(30);
    expect(result.lineItemDiscounts[0].productId).toBe('p1');
  });

  it('should cap line-item fixed discount at item total', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByAmount', value: 500, targetIds: ['p1'] },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(100);
  });

  it('should apply shipping discount alongside cart discount', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
      { actionType: 'discountShipping', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.shippingDiscountAmount).toBe(10);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should cap shipping discount at shipping amount', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
      { actionType: 'discountShipping', value: 50, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.shippingDiscountAmount).toBe(15);
  });

  it('should add free items', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'freeItem', value: 'p3', targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.freeItems).toHaveLength(1);
    expect(result.freeItems[0].productId).toBe('p3');
  });

  it('should set freeShipping for shipping scope', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([
      { ...activePromotion, scope: 'shipping' },
    ]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.freeShipping).toBe(true);
  });

  it('should apply coupon code promotions first', async () => {
    const couponPromo = { ...activePromotion, promotionId: 'coupon1', name: 'SAVE10', code: 'SAVE10', priority: 5 };
    const autoPromo = { ...activePromotion, promotionId: 'auto1', name: 'Auto 5%', priority: 1 };
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([couponPromo, autoPromo]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate({ ...baseContext, couponCode: 'save10' });
    expect(result.appliedPromotions).toHaveLength(2);
    expect(result.appliedPromotions[0].promotionId).toBe('coupon1');
  });

  it('should stop after exclusive promotion', async () => {
    const exclusivePromo = { ...activePromotion, isExclusive: true, priority: 10 };
    const otherPromo = { ...activePromotion, promotionId: 'promo2', priority: 5 };
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([exclusivePromo, otherPromo]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 20, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(1);
  });

  it('should skip inactive promotions', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([
      { ...activePromotion, isActive: false },
    ]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should skip promotions with status != active', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([
      { ...activePromotion, status: 'paused' },
    ]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should skip promotions at max usage', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([
      { ...activePromotion, maxUsage: 5, usageCount: 5 },
    ]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should skip promotions below minOrderAmount', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([
      { ...activePromotion, minOrderAmount: 500 },
    ]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([]);

    const result = await service.evaluate(baseContext);
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it('should evaluate cartTotal rule with >= operator', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'cartTotal', operator: '>=', value: 150 },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should fail cartTotal rule when below threshold', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'cartTotal', operator: '>=', value: 500 },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should evaluate itemQuantity rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'itemQuantity', operator: '>=', value: 3 },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate productCategory rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'productCategory', operator: '=', value: ['cat1'] },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should fail productCategory rule when no match', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'productCategory', operator: '=', value: ['cat99'] },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should evaluate customerGroup rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'customerGroup', operator: '=', value: ['vip'] },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate({ ...baseContext, customerGroup: 'vip' });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should fail customerGroup rule when no group', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'customerGroup', operator: '=', value: ['vip'] },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should evaluate firstOrder rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'firstOrder', operator: '=', value: true },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate({ ...baseContext, isFirstOrder: true });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate shippingMethod rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'shippingMethod', operator: '=', value: ['sm1'] },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate({ ...baseContext, shippingMethodId: 'sm1' });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate paymentMethod rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'paymentMethod', operator: '=', value: ['pm1'] },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate({ ...baseContext, paymentMethodId: 'pm1' });
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate dateRange rule', async () => {
    const now = new Date();
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'dateRange', operator: '=', value: { start: now.toISOString(), end: new Date(now.getTime() + 86400000).toISOString() } },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate dayOfWeek rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'dayOfWeek', operator: '=', value: [new Date().getDay()] },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should evaluate timeOfDay rule', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'timeOfDay', operator: '=', value: { startHour: 0, endHour: 24 } },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should cap total discount at maxDiscountAmount', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([
      { ...activePromotion, maxDiscountAmount: 30 },
    ]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 50, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(30);
  });

  it('should cap total discount at subtotal', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 200, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockRejectedValue(new Error('DB error'));
    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(0);
  });

  it('should pass when no rules (always applicable)', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should compare with > operator', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([activePromotion]);
    (promotionRuleRepository.promotions.findRulesByPromotionId as jest.Mock).mockResolvedValue([
      { condition: 'cartTotal', operator: '>', value: 150 },
    ]);
    (promotionRuleRepository.promotions.findActionsByPromotionId as jest.Mock).mockResolvedValue([
      { actionType: 'discountByPercentage', value: 10, targetIds: null },
    ]);

    const result = await service.evaluate(baseContext);
    expect(result.totalDiscountAmount).toBe(20);
  });

  it('should handle empty items', async () => {
    (promotionRuleRepository.promotions.findActive as jest.Mock).mockResolvedValue([]);
    const result = await service.evaluate({ items: [], subtotal: 0, shippingAmount: 0, currency: 'USD' });
    expect(result.totalDiscountAmount).toBe(0);
  });
});
