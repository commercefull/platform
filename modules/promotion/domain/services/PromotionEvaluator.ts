/**
 * Promotion Evaluator — domain service
 *
 * Pure promotion-evaluation logic extracted from the former
 * application-layer PromotionEvaluationService. No I/O — the use case
 * fetches promotions, rules, and actions through the repository port and
 * passes them here.
 *
 * Supports all 10 rule condition types (cartTotal, itemQuantity,
 * productCategory, customerGroup, firstOrder, dateRange, timeOfDay,
 * dayOfWeek, shippingMethod, paymentMethod) and all 6 action types
 * (discountByPercentage, discountByAmount, discountShipping, freeItem,
 * discountByTier, freeGift), including line-item-level discounts for
 * product/category-scoped promotions.
 */

import type { ActionType, RuleCondition } from '../repositories/PromotionRepository';
import type { Promotion, PromotionAction, PromotionRule } from '../entities/PromotionModel';

// ============================================================================
// Context
// ============================================================================

interface PromotionItemContext {
  productId: string;
  productVariantId?: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  categoryId?: string;
  brandId?: string;
  isDigital?: boolean;
}

export interface PromotionEvaluationContext {
  items: PromotionItemContext[];
  subtotalCents: number;
  shippingAmountCents: number;
  customerId?: string;
  customerGroup?: string;
  isFirstOrder?: boolean;
  shippingMethodId?: string;
  paymentMethodId?: string;
  couponCode?: string;
  storeId?: string;
  channelId?: string;
  countryCode?: string;
  currency: string;
}

// ============================================================================
// Result
// ============================================================================

interface LineItemDiscount {
  productId: string;
  discountAmountCents: number;
  promotionId: string;
  promotionName: string;
}

interface FreeItemAction {
  productId: string;
  quantity: number;
  promotionId: string;
  promotionName: string;
}

export interface PromotionEvaluationResult {
  totalDiscountAmountCents: number;
  shippingDiscountAmountCents: number;
  freeShipping: boolean;
  lineItemDiscounts: LineItemDiscount[];
  freeItems: FreeItemAction[];
  appliedPromotions: Array<{
    promotionId: string;
    name: string;
    type: string;
    discountAmountCents: number;
  }>;
  message?: string;
}

export interface PromotionActionApplication {
  discountAmountCents: number;
  shippingDiscountAmountCents: number;
  freeShipping: boolean;
  lineItemDiscounts: LineItemDiscount[];
  freeItems: FreeItemAction[];
}

// ============================================================================
// Evaluation
// ============================================================================

/**
 * Evaluate all rules for a promotion. All rules must pass (AND logic).
 */
export function promotionRulesPass(rules: PromotionRule[], context: PromotionEvaluationContext): boolean {
  const activeRules = rules.filter(r => r.isActive !== false && r.condition && r.operator);
  if (activeRules.length === 0) return true; // No rules = always applicable

  for (const rule of activeRules) {
    if (!promotionRuleMatches(rule.condition as RuleCondition, rule.operator, rule.value, context)) {
      return false;
    }
  }
  return true;
}

/**
 * Evaluate a single rule condition
 */
export function promotionRuleMatches(
  condition: RuleCondition,
  operator: string,
  value: unknown,
  context: PromotionEvaluationContext,
): boolean {
  switch (condition) {
    case 'cartTotal': {
      const threshold = Number(value);
      return compareValues(context.subtotalCents, operator, threshold);
    }

    case 'itemQuantity': {
      const threshold = Number(value);
      return compareValues(totalQuantity(context.items), operator, threshold);
    }

    case 'firstOrder': {
      return context.isFirstOrder === true;
    }

    case 'dateRange': {
      const range = value as { start: string; end: string };
      const now = new Date();
      const start = new Date(range.start);
      const end = new Date(range.end);
      return now >= start && now <= end;
    }

    case 'timeOfDay': {
      const range = value as { startHour: number; endHour: number };
      const hour = new Date().getHours();
      return hour >= range.startHour && hour < range.endHour;
    }

    case 'dayOfWeek': {
      const days = value as number[];
      const today = new Date().getDay();
      return days.includes(today);
    }

    default:
      return membershipRuleMatches(condition, value, context);
  }
}

/**
 * Membership-style rule conditions — a context field must be in the rule's
 * value list (or, for productCategory, any item's categoryId must be).
 */
function membershipRuleMatches(condition: RuleCondition, value: unknown, context: PromotionEvaluationContext): boolean {
  const list = value as string[];

  switch (condition) {
    case 'productCategory':
      return context.items.some(item => item.categoryId && list.includes(item.categoryId));

    case 'customerGroup':
      return Boolean(context.customerGroup && list.includes(context.customerGroup));

    case 'shippingMethod':
      return Boolean(context.shippingMethodId && list.includes(context.shippingMethodId));

    case 'paymentMethod':
      return Boolean(context.paymentMethodId && list.includes(context.paymentMethodId));

    case 'store':
      return Boolean(context.storeId && list.includes(context.storeId));

    case 'channel':
      return Boolean(context.channelId && list.includes(context.channelId));

    case 'country':
      return Boolean(context.countryCode && list.includes(context.countryCode));

    case 'currency':
      return list.includes(context.currency);

    default:
      return false;
  }
}

/**
 * Apply promotion actions and compute discounts
 */
export function applyPromotionActions(
  promotion: Promotion,
  actions: PromotionAction[],
  context: PromotionEvaluationContext,
): PromotionActionApplication {
  const application: PromotionActionApplication = {
    discountAmountCents: 0,
    shippingDiscountAmountCents: 0,
    freeShipping: false,
    lineItemDiscounts: [],
    freeItems: [],
  };

  for (const action of actions) {
    applyPromotionAction(application, promotion, action, context);
  }

  // Also handle promotion entity types (buy_x_get_y, free_shipping, bundle)
  // These are handled via the Promotion domain entity type field if present
  if (promotion.scope === 'shipping') {
    application.freeShipping = true;
  }

  return application;
}

function applyPromotionAction(
  application: PromotionActionApplication,
  promotion: Promotion,
  action: PromotionAction,
  context: PromotionEvaluationContext,
): void {
  switch (action.actionType as ActionType) {
    case 'discountByPercentage':
      applyPercentageDiscount(application, promotion, action, context);
      break;

    case 'discountByAmount':
      applyAmountDiscount(application, promotion, action, context);
      break;

    case 'discountShipping': {
      const shippingDiscountCents = Math.round(Number(action.value));
      application.shippingDiscountAmountCents += Math.min(shippingDiscountCents, context.shippingAmountCents);
      break;
    }

    case 'freeItem':
      application.freeItems.push({
        productId: action.value as string,
        quantity: 1,
        promotionId: promotion.promotionId,
        promotionName: promotion.name,
      });
      break;

    case 'discountByTier':
      applyTierDiscount(application, promotion, action, context);
      break;

    case 'freeGift':
      applyFreeGift(application, promotion, action, context);
      break;

    default:
      break;
  }
}

/**
 * Line-item discounts for specific products. Returns true when the action is
 * product-targeted (targetIds non-empty) so callers can decide whether the
 * cart-level fallback should run instead.
 */
function addTargetedLineDiscounts(
  application: PromotionActionApplication,
  promotion: Promotion,
  items: PromotionItemContext[],
  targetIds: string[] | null,
  discountForItem: (item: PromotionItemContext) => number,
): boolean {
  if (!targetIds || targetIds.length === 0) return false;

  for (const item of items) {
    if (!targetIds.includes(item.productId)) continue;

    const itemDiscountCents = discountForItem(item);
    application.lineItemDiscounts.push({
      productId: item.productId,
      discountAmountCents: itemDiscountCents,
      promotionId: promotion.promotionId,
      promotionName: promotion.name,
    });
    application.discountAmountCents += itemDiscountCents;
  }
  return true;
}

function applyPercentageDiscount(
  application: PromotionActionApplication,
  promotion: Promotion,
  action: PromotionAction,
  context: PromotionEvaluationContext,
): void {
  const percentage = Number(action.value);
  const applied = addTargetedLineDiscounts(application, promotion, context.items, action.targetIds as string[] | null, item =>
    Math.round(item.unitPriceCents * item.quantity * (percentage / 100)),
  );

  // Cart-level percentage discount when the action is not product-targeted
  if (!applied) {
    application.discountAmountCents += Math.round(context.subtotalCents * (percentage / 100));
  }
}

function applyAmountDiscount(
  application: PromotionActionApplication,
  promotion: Promotion,
  action: PromotionAction,
  context: PromotionEvaluationContext,
): void {
  const amountCents = Math.round(Number(action.value));
  const applied = addTargetedLineDiscounts(application, promotion, context.items, action.targetIds as string[] | null, item =>
    Math.min(amountCents, item.unitPriceCents * item.quantity),
  );

  if (!applied) {
    application.discountAmountCents += Math.min(amountCents, context.subtotalCents);
  }
}

function applyTierDiscount(
  application: PromotionActionApplication,
  promotion: Promotion,
  action: PromotionAction,
  context: PromotionEvaluationContext,
): void {
  const tiers = action.value as Array<{ min: number; max?: number; percentage?: number; amount?: number }>;
  if (!Array.isArray(tiers) || tiers.length === 0) return;

  // Determine the metric: total quantity by default, or cart total if
  // the first tier's `min` looks like a monetary threshold (> 100 heuristic
  // is avoided — instead we check which tier the subtotal falls into).
  // Tiers are evaluated by quantity first; if no quantity tier matches,
  // fall back to subtotal-based tiering.
  const totalQty = totalQuantity(context.items);

  // Try quantity-based tiering first, then fall back to subtotal-based
  // tiering if no quantity tier matched
  const tier =
    tiers.find(t => totalQty >= t.min && (t.max === undefined || totalQty <= t.max)) ??
    tiers.find(t => context.subtotalCents >= t.min && (t.max === undefined || context.subtotalCents <= t.max));

  if (!tier) return;

  if (tier.percentage !== undefined) {
    const percentage = tier.percentage;
    const applied = addTargetedLineDiscounts(application, promotion, context.items, action.targetIds as string[] | null, item =>
      Math.round(item.unitPriceCents * item.quantity * (percentage / 100)),
    );

    if (!applied) {
      application.discountAmountCents += Math.round(context.subtotalCents * (percentage / 100));
    }
  } else if (tier.amount !== undefined) {
    application.discountAmountCents += Math.min(tier.amount, context.subtotalCents);
  }
}

function applyFreeGift(
  application: PromotionActionApplication,
  promotion: Promotion,
  action: PromotionAction,
  context: PromotionEvaluationContext,
): void {
  // freeGift is distinct from freeItem: it supports eligibility conditions
  // on the gift itself (e.g. "free gift only if cart has > 5 items").
  const giftConfig = action.value as { productId: string; quantity?: number; minCartTotal?: number; minQuantity?: number };
  if (!giftConfig || !giftConfig.productId) return;

  // Check gift eligibility conditions
  if (giftConfig.minCartTotal !== undefined && context.subtotalCents < giftConfig.minCartTotal) return;
  if (giftConfig.minQuantity !== undefined && totalQuantity(context.items) < giftConfig.minQuantity) return;

  application.freeItems.push({
    productId: giftConfig.productId,
    quantity: giftConfig.quantity ?? 1,
    promotionId: promotion.promotionId,
    promotionName: promotion.name,
  });
}

function totalQuantity(items: PromotionItemContext[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Numeric comparison helper
 */
function compareValues(actual: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '>=':
      return actual >= threshold;
    case '>':
      return actual > threshold;
    case '<=':
      return actual <= threshold;
    case '<':
      return actual < threshold;
    case '=':
    case '==':
      return actual === threshold;
    case '!=':
      return actual !== threshold;
    default:
      return actual >= threshold;
  }
}
