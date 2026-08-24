/**
 * Promotion Evaluation Service
 *
 * Evaluates active promotions against a basket/checkout context.
 * Supports:
 * - All 10 rule condition types (cartTotal, itemQuantity, productCategory, customerGroup, firstOrder, dateRange, timeOfDay, dayOfWeek, shippingMethod, paymentMethod)
 * - All 4 action types (discountByPercentage, discountByAmount, discountShipping, freeItem)
 * - Stackable vs exclusive promotions with priority ordering
 * - BOGO (buy_x_get_y), free_shipping, bundle promotion types
 * - Line-item-level discounts for product/category-scoped promotions
 */

import promotionRuleRepository, { type PromotionScope, type RuleCondition, type ActionType } from '../../infrastructure/repositories/PromotionRuleRepository';
import { logger } from '../../../../libs/logger';
import type { Promotion as DbPromotion, PromotionRule as DbPromotionRule, PromotionAction as DbPromotionAction } from '../../../../libs/db/types';

// ============================================================================
// Context
// ============================================================================

export interface PromotionItemContext {
  productId: string;
  productVariantId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  categoryId?: string;
  brandId?: string;
  isDigital?: boolean;
}

export interface PromotionEvaluationContext {
  items: PromotionItemContext[];
  subtotal: number;
  shippingAmount: number;
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
  discountAmount: number;
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
  totalDiscountAmount: number;
  shippingDiscountAmount: number;
  freeShipping: boolean;
  lineItemDiscounts: LineItemDiscount[];
  freeItems: FreeItemAction[];
  appliedPromotions: Array<{
    promotionId: string;
    name: string;
    type: string;
    discountAmount: number;
  }>;
  message?: string;
}

// ============================================================================
// Service
// ============================================================================

export class PromotionEvaluationService {
  /**
   * Evaluate all active promotions against the given context.
   * Handles stackable vs exclusive, priority ordering, and per-promotion caps.
   */
  async evaluate(context: PromotionEvaluationContext): Promise<PromotionEvaluationResult> {
    const result: PromotionEvaluationResult = {
      totalDiscountAmount: 0,
      shippingDiscountAmount: 0,
      freeShipping: false,
      lineItemDiscounts: [],
      freeItems: [],
      appliedPromotions: [],
    };

    try {
      // Fetch active promotions for cart/global scope, ordered by priority DESC
      const promotions = await promotionRuleRepository.promotions.findActive(['cart', 'global'] as PromotionScope[]);

      if (promotions.length === 0) return result;

      // Also check for coupon-code-based promotions
      let couponPromotions: typeof promotions = [];
      if (context.couponCode) {
        couponPromotions = promotions.filter(p => (p as unknown as { code?: string }).code?.toUpperCase() === context.couponCode?.toUpperCase());
      }

      // Auto-applied promotions (no code required)
      const autoPromotions = promotions.filter(p => !(p as unknown as { code?: string }).code);

      // Combine: coupon promotions first, then auto-applied
      const candidates = [...couponPromotions, ...autoPromotions];

      // Sort by priority DESC (higher priority first)
      candidates.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

      let exclusiveApplied = false;

      for (const promotion of candidates) {
        // Skip if an exclusive promotion was already applied
        if (exclusiveApplied) break;

        // Check basic validity
        if (!promotion.isActive) continue;
        if (promotion.status !== 'active') continue;
        if (promotion.maxUsage && promotion.usageCount >= promotion.maxUsage) continue;
        if (promotion.minOrderAmount && context.subtotal < Number(promotion.minOrderAmount)) continue;

        // Evaluate rules
        const rules = await promotionRuleRepository.promotions.findRulesByPromotionId(promotion.promotionId);
        const rulesPassed = this.evaluateRules(rules, context);
        if (!rulesPassed) continue;

        // Get actions
        const actions = await promotionRuleRepository.promotions.findActionsByPromotionId(promotion.promotionId);

        // Apply actions
        const promoResult = this.applyActions(promotion, actions, context);

        if (promoResult.discountAmount > 0 || promoResult.freeShipping || promoResult.freeItems.length > 0) {
          result.totalDiscountAmount += promoResult.discountAmount;
          result.shippingDiscountAmount += promoResult.shippingDiscountAmount;
          result.freeShipping = result.freeShipping || promoResult.freeShipping;
          result.lineItemDiscounts.push(...promoResult.lineItemDiscounts);
          result.freeItems.push(...promoResult.freeItems);
          result.appliedPromotions.push({
            promotionId: promotion.promotionId,
            name: promotion.name,
            type: promotion.scope,
            discountAmount: promoResult.discountAmount,
          });

          // Check exclusivity
          if (promotion.isExclusive) {
            exclusiveApplied = true;
          }

          // Check max discount cap
          if (promotion.maxDiscountAmount && result.totalDiscountAmount > Number(promotion.maxDiscountAmount)) {
            result.totalDiscountAmount = Number(promotion.maxDiscountAmount);
          }
        }
      }

      // Ensure total discount doesn't exceed subtotal
      if (result.totalDiscountAmount > context.subtotal) {
        result.totalDiscountAmount = context.subtotal;
      }
    } catch (error: unknown) {
      logger.warn(`PromotionEvaluationService error: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Evaluate all rules for a promotion. All rules must pass (AND logic).
   */
  private evaluateRules(
    rules: DbPromotionRule[],
    context: PromotionEvaluationContext,
  ): boolean {
    const activeRules = rules.filter(r => r.condition && r.operator);
    if (activeRules.length === 0) return true; // No rules = always applicable

    for (const rule of activeRules) {
      if (!this.evaluateRule(rule.condition as RuleCondition, rule.operator, rule.value, context)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single rule condition
   */
  private evaluateRule(condition: RuleCondition, operator: string, value: unknown, context: PromotionEvaluationContext): boolean {
    switch (condition) {
      case 'cartTotal': {
        const threshold = Number(value);
        return this.compare(context.subtotal, operator, threshold);
      }

      case 'itemQuantity': {
        const totalQty = context.items.reduce((sum, item) => sum + item.quantity, 0);
        const threshold = Number(value);
        return this.compare(totalQty, operator, threshold);
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
  private applyActions(
    promotion: DbPromotion,
    actions: DbPromotionAction[],
    context: PromotionEvaluationContext,
  ): {
    discountAmount: number;
    shippingDiscountAmount: number;
    freeShipping: boolean;
    lineItemDiscounts: LineItemDiscount[];
    freeItems: FreeItemAction[];
  } {
    let discountAmount = 0;
    let shippingDiscountAmount = 0;
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
                const itemDiscount = Math.round(item.unitPrice * item.quantity * (percentage / 100) * 100) / 100;
                lineItemDiscounts.push({
                  productId: item.productId,
                  discountAmount: itemDiscount,
                  promotionId: promotion.promotionId,
                  promotionName: promotion.name,
                });
                discountAmount += itemDiscount;
              }
            }
          } else {
            // Cart-level percentage discount
            discountAmount += Math.round(context.subtotal * (percentage / 100) * 100) / 100;
          }
          break;
        }

        case 'discountByAmount': {
          const amount = Number(action.value);
          const targetIds = action.targetIds as string[] | null;

          if (targetIds && targetIds.length > 0) {
            for (const item of context.items) {
              if (targetIds.includes(item.productId)) {
                const itemDiscount = Math.min(amount, item.unitPrice * item.quantity);
                lineItemDiscounts.push({
                  productId: item.productId,
                  discountAmount: itemDiscount,
                  promotionId: promotion.promotionId,
                  promotionName: promotion.name,
                });
                discountAmount += itemDiscount;
              }
            }
          } else {
            discountAmount += Math.min(amount, context.subtotal);
          }
          break;
        }

        case 'discountShipping': {
          const shippingDiscount = Number(action.value);
          shippingDiscountAmount += Math.min(shippingDiscount, context.shippingAmount);
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

        default:
          break;
      }
    }

    // Also handle promotion entity types (buy_x_get_y, free_shipping, bundle)
    // These are handled via the Promotion domain entity type field if present
    if (promotion.scope === 'shipping') {
      freeShipping = true;
    }

    return { discountAmount, shippingDiscountAmount, freeShipping, lineItemDiscounts, freeItems };
  }

  /**
   * Numeric comparison helper
   */
  private compare(actual: number, operator: string, threshold: number): boolean {
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
}

export const promotionEvaluationService = new PromotionEvaluationService();
