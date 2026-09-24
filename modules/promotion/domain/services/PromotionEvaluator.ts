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

export interface PromotionItemContext {
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
  currency: string;
}

// ============================================================================
// Result
// ============================================================================

export interface LineItemDiscount {
  productId: string;
  discountAmountCents: number;
  promotionId: string;
  promotionName: string;
}

export interface FreeItemAction {
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
      const totalQty = context.items.reduce((sum, item) => sum + item.quantity, 0);
      const threshold = Number(value);
      return compareValues(totalQty, operator, threshold);
    }

    case 'productCategory': {
      const categories = value as string[];
      const hasCategory = context.items.some(item => item.categoryId && categories.includes(item.categoryId));
      return hasCategory;
    }

    case 'customerGroup': {
      if (!context.customerGroup) return false;
      const groups = value as string[];
      return groups.includes(context.customerGroup);
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

    case 'shippingMethod': {
      if (!context.shippingMethodId) return false;
      const methods = value as string[];
      return methods.includes(context.shippingMethodId);
    }

    case 'paymentMethod': {
      if (!context.paymentMethodId) return false;
      const methods = value as string[];
      return methods.includes(context.paymentMethodId);
    }

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
  let discountAmountCents = 0;
  let shippingDiscountAmountCents = 0;
  let freeShipping = false;
  const lineItemDiscounts: LineItemDiscount[] = [];
  const freeItems: FreeItemAction[] = [];

  for (const action of actions) {
    switch (action.actionType as ActionType) {
      case 'discountByPercentage': {
        const percentage = Number(action.value);
        const targetIds = action.targetIds as string[] | null;

        if (targetIds && targetIds.length > 0) {
          // Line-item discount for specific products
          for (const item of context.items) {
            if (targetIds.includes(item.productId)) {
              const itemDiscountCents = Math.round(item.unitPriceCents * item.quantity * (percentage / 100));
              lineItemDiscounts.push({
                productId: item.productId,
                discountAmountCents: itemDiscountCents,
                promotionId: promotion.promotionId,
                promotionName: promotion.name,
              });
              discountAmountCents += itemDiscountCents;
            }
          }
        } else {
          // Cart-level percentage discount
          discountAmountCents += Math.round(context.subtotalCents * (percentage / 100));
        }
        break;
      }

      case 'discountByAmount': {
        const amountCents = Math.round(Number(action.value));
        const targetIds = action.targetIds as string[] | null;

        if (targetIds && targetIds.length > 0) {
          for (const item of context.items) {
            if (targetIds.includes(item.productId)) {
              const itemDiscountCents = Math.min(amountCents, item.unitPriceCents * item.quantity);
              lineItemDiscounts.push({
                productId: item.productId,
                discountAmountCents: itemDiscountCents,
                promotionId: promotion.promotionId,
                promotionName: promotion.name,
              });
              discountAmountCents += itemDiscountCents;
            }
          }
        } else {
          discountAmountCents += Math.min(amountCents, context.subtotalCents);
        }
        break;
      }

      case 'discountShipping': {
        const shippingDiscountCents = Math.round(Number(action.value));
        shippingDiscountAmountCents += Math.min(shippingDiscountCents, context.shippingAmountCents);
        break;
      }

      case 'freeItem': {
        const productId = action.value as string;
        const targetIds = action.targetIds as string[] | null;
        const quantity = targetIds ? 1 : 1;
        freeItems.push({
          productId,
          quantity,
          promotionId: promotion.promotionId,
          promotionName: promotion.name,
        });
        break;
      }

      case 'discountByTier': {
        const tiers = action.value as Array<{ min: number; max?: number; percentage?: number; amount?: number }>;
        if (!Array.isArray(tiers) || tiers.length === 0) break;

        // Determine the metric: total quantity by default, or cart total if
        // the first tier's `min` looks like a monetary threshold (> 100 heuristic
        // is avoided — instead we check which tier the subtotal falls into).
        // Tiers are evaluated by quantity first; if no quantity tier matches,
        // fall back to subtotal-based tiering.
        const totalQty = context.items.reduce((sum, item) => sum + item.quantity, 0);

        // Try quantity-based tiering first
        let tier = tiers.find(t => totalQty >= t.min && (t.max === undefined || totalQty <= t.max));

        // Fall back to subtotal-based tiering if no quantity tier matched
        if (!tier) {
          tier = tiers.find(t => context.subtotalCents >= t.min && (t.max === undefined || context.subtotalCents <= t.max));
        }

        if (!tier) break;

        const targetIds = action.targetIds as string[] | null;
        if (tier.percentage !== undefined) {
          if (targetIds && targetIds.length > 0) {
            for (const item of context.items) {
              if (targetIds.includes(item.productId)) {
                const itemDiscountCents = Math.round(item.unitPriceCents * item.quantity * (tier.percentage! / 100));
                lineItemDiscounts.push({
                  productId: item.productId,
                  discountAmountCents: itemDiscountCents,
                  promotionId: promotion.promotionId,
                  promotionName: promotion.name,
                });
                discountAmountCents += itemDiscountCents;
              }
            }
          } else {
            discountAmountCents += Math.round(context.subtotalCents * (tier.percentage / 100));
          }
        } else if (tier.amount !== undefined) {
          discountAmountCents += Math.min(tier.amount, context.subtotalCents);
        }
        break;
      }

      case 'freeGift': {
        // freeGift is distinct from freeItem: it supports eligibility conditions
        // on the gift itself (e.g. "free gift only if cart has > 5 items").
        const giftConfig = action.value as { productId: string; quantity?: number; minCartTotal?: number; minQuantity?: number };
        if (!giftConfig || !giftConfig.productId) break;

        // Check gift eligibility conditions
        const totalQty = context.items.reduce((sum, item) => sum + item.quantity, 0);
        if (giftConfig.minCartTotal !== undefined && context.subtotalCents < giftConfig.minCartTotal) break;
        if (giftConfig.minQuantity !== undefined && totalQty < giftConfig.minQuantity) break;

        freeItems.push({
          productId: giftConfig.productId,
          quantity: giftConfig.quantity ?? 1,
          promotionId: promotion.promotionId,
          promotionName: promotion.name,
        });
        break;
      }

      default:
        break;
    }
  }

  // Also handle promotion entity types (buy_x_get_y, free_shipping, bundle)
  // These are handled via the Promotion domain entity type field if present
  if (promotion.scope === 'shipping') {
    freeShipping = true;
  }

  return { discountAmountCents, shippingDiscountAmountCents, freeShipping, lineItemDiscounts, freeItems };
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
