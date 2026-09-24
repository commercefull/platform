/**
 * Unit Tests for PromotionEvaluator (domain service)
 *
 * Pure functions — no mocks needed beyond the record factories.
 */

import { createPromotion, createPromotionRule, createPromotionAction } from '../../tests/testUtils';
import {
  promotionRulesPass,
  promotionRuleMatches,
  applyPromotionActions,
  type PromotionEvaluationContext,
} from './PromotionEvaluator';

const baseContext: PromotionEvaluationContext = {
  items: [
    { productId: 'p1', name: 'Widget', quantity: 2, unitPriceCents: 50, categoryId: 'cat1' },
    { productId: 'p2', name: 'Gadget', quantity: 1, unitPriceCents: 100, categoryId: 'cat2' },
  ],
  subtotalCents: 200,
  shippingAmountCents: 15,
  currency: 'USD',
};

describe('promotionRulesPass', () => {
  it('should pass when there are no rules', () => {
    expect(promotionRulesPass([], baseContext)).toBe(true);
  });

  it('should pass when all rules match (AND logic)', () => {
    const rules = [
      createPromotionRule({ condition: 'cartTotal', operator: '>=', value: 100 }),
      createPromotionRule({ condition: 'itemQuantity', operator: '>=', value: 3 }),
    ];
    expect(promotionRulesPass(rules, baseContext)).toBe(true);
  });

  it('should fail when any rule does not match', () => {
    const rules = [
      createPromotionRule({ condition: 'cartTotal', operator: '>=', value: 100 }),
      createPromotionRule({ condition: 'itemQuantity', operator: '>=', value: 10 }),
    ];
    expect(promotionRulesPass(rules, baseContext)).toBe(false);
  });

  it('should ignore inactive rules', () => {
    const rules = [createPromotionRule({ condition: 'cartTotal', operator: '>=', value: 99999, isActive: false })];
    expect(promotionRulesPass(rules, baseContext)).toBe(true);
  });
});

describe('promotionRuleMatches', () => {
  it('should evaluate cartTotal against the subtotal with the given operator', () => {
    expect(promotionRuleMatches('cartTotal', '>=', 200, baseContext)).toBe(true);
    expect(promotionRuleMatches('cartTotal', '>', 200, baseContext)).toBe(false);
    expect(promotionRuleMatches('cartTotal', '<', 500, baseContext)).toBe(true);
  });

  it('should evaluate itemQuantity against total item quantity', () => {
    expect(promotionRuleMatches('itemQuantity', '=', 3, baseContext)).toBe(true);
    expect(promotionRuleMatches('itemQuantity', '!=', 3, baseContext)).toBe(false);
  });

  it('should match productCategory when any item is in the category list', () => {
    expect(promotionRuleMatches('productCategory', 'in', ['cat2'], baseContext)).toBe(true);
    expect(promotionRuleMatches('productCategory', 'in', ['cat9'], baseContext)).toBe(false);
  });

  it('should match customerGroup only when the context has a matching group', () => {
    expect(promotionRuleMatches('customerGroup', 'in', ['vip'], { ...baseContext, customerGroup: 'vip' })).toBe(true);
    expect(promotionRuleMatches('customerGroup', 'in', ['vip'], baseContext)).toBe(false);
  });

  it('should match firstOrder only when the context flags it', () => {
    expect(promotionRuleMatches('firstOrder', 'eq', true, { ...baseContext, isFirstOrder: true })).toBe(true);
    expect(promotionRuleMatches('firstOrder', 'eq', true, baseContext)).toBe(false);
  });

  it('should match shippingMethod and paymentMethod against the context ids', () => {
    expect(promotionRuleMatches('shippingMethod', 'in', ['sm1'], { ...baseContext, shippingMethodId: 'sm1' })).toBe(true);
    expect(promotionRuleMatches('paymentMethod', 'in', ['pm1'], baseContext)).toBe(false);
  });

  it('should return false for unknown conditions', () => {
    expect(promotionRuleMatches('nonsense' as never, 'eq', 1, baseContext)).toBe(false);
  });
});

describe('applyPromotionActions', () => {
  const promotion = createPromotion({ promotionId: 'promo-1', name: 'Promo' });

  it('should apply a cart-level percentage discount', () => {
    const result = applyPromotionActions(promotion, [createPromotionAction({ actionType: 'discountByPercentage', value: 10 })], baseContext);
    expect(result.discountAmountCents).toBe(20);
    expect(result.lineItemDiscounts).toEqual([]);
  });

  it('should apply a percentage discount only to targeted line items', () => {
    const result = applyPromotionActions(
      promotion,
      [createPromotionAction({ actionType: 'discountByPercentage', value: 50, targetIds: ['p2'] })],
      baseContext,
    );
    // 50% of 100 cents x 1 = 50
    expect(result.discountAmountCents).toBe(50);
    expect(result.lineItemDiscounts).toEqual([
      { productId: 'p2', discountAmountCents: 50, promotionId: 'promo-1', promotionName: 'Promo' },
    ]);
  });

  it('should cap a fixed amount discount at the item/subtotal value', () => {
    const result = applyPromotionActions(
      promotion,
      [createPromotionAction({ actionType: 'discountByAmount', value: 999 })],
      baseContext,
    );
    expect(result.discountAmountCents).toBe(200);
  });

  it('should cap a shipping discount at the shipping amount', () => {
    const result = applyPromotionActions(
      promotion,
      [createPromotionAction({ actionType: 'discountShipping', value: 999 })],
      baseContext,
    );
    expect(result.shippingDiscountAmountCents).toBe(15);
    expect(result.discountAmountCents).toBe(0);
  });

  it('should add a freeItem', () => {
    const result = applyPromotionActions(
      promotion,
      [createPromotionAction({ actionType: 'freeItem', value: 'gift-1' })],
      baseContext,
    );
    expect(result.freeItems).toEqual([
      { productId: 'gift-1', quantity: 1, promotionId: 'promo-1', promotionName: 'Promo' },
    ]);
  });

  it('should add a freeGift only when eligibility thresholds are met', () => {
    const gift = createPromotionAction({
      actionType: 'freeGift',
      value: { productId: 'gift-1', quantity: 2, minCartTotal: 150 },
    });
    const eligible = applyPromotionActions(promotion, [gift], baseContext);
    expect(eligible.freeItems[0]).toMatchObject({ productId: 'gift-1', quantity: 2 });

    const ineligible = applyPromotionActions(promotion, [gift], { ...baseContext, subtotalCents: 100 });
    expect(ineligible.freeItems).toEqual([]);
  });

  it('should apply a quantity-based tier discount', () => {
    const tiered = createPromotionAction({
      actionType: 'discountByTier',
      value: [
        { min: 5, percentage: 10 },
        { min: 2, max: 4, percentage: 5 },
      ],
    });
    // totalQty = 3 → second tier → 5% of 200 = 10
    const result = applyPromotionActions(promotion, [tiered], baseContext);
    expect(result.discountAmountCents).toBe(10);
  });

  it('should fall back to subtotal-based tiering when no quantity tier matches', () => {
    const tiered = createPromotionAction({
      actionType: 'discountByTier',
      value: [{ min: 1000, percentage: 0 }, { min: 150, amount: 30 }],
    });
    // totalQty 3 matches no tier; subtotal 200 matches the 150-min tier → 30 cents capped by subtotal
    const result = applyPromotionActions(promotion, [tiered], baseContext);
    expect(result.discountAmountCents).toBe(30);
  });

  it('should grant free shipping for shipping-scoped promotions', () => {
    const shippingPromo = createPromotion({ scope: 'shipping' });
    const result = applyPromotionActions(shippingPromo, [], baseContext);
    expect(result.freeShipping).toBe(true);
  });
});
