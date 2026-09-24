/**
 * EvaluatePromotions Use Case
 *
 * Evaluates all active promotions against a basket/checkout context.
 * Orchestration only — rule matching and action application live in the
 * domain evaluator (`domain/services/PromotionEvaluator`); stackable vs
 * exclusive resolution uses `libs/rules/stacking`.
 */

import type {
  PromotionScope,
  PromotionRepository,
  Promotion,
  PromotionAction,
  PromotionRule,
} from '../../domain/repositories/PromotionRepository';
import {
  applyPromotionActions,
  promotionRulesPass,
  type PromotionEvaluationContext,
  type PromotionEvaluationResult,
} from '../../domain/services/PromotionEvaluator';
import { resolveStackable, sortByPriority, type Stackability } from '../../../../libs/rules/stacking';
import { logger } from '../../../../libs/logger';

export type {
  PromotionEvaluationContext,
  PromotionEvaluationResult,
  PromotionItemContext,
  LineItemDiscount,
  FreeItemAction,
} from '../../domain/services/PromotionEvaluator';

export class EvaluatePromotionsUseCase {
  constructor(
    private readonly promotionRepo: Pick<
      PromotionRepository,
      'findActive' | 'findRulesByPromotionId' | 'findActionsByPromotionId'
    >,
  ) {}

  /**
   * Evaluate all active promotions against the given context.
   * Handles stackable vs exclusive, priority ordering, and per-promotion caps.
   */
  async execute(context: PromotionEvaluationContext): Promise<PromotionEvaluationResult> {
    const result: PromotionEvaluationResult = {
      totalDiscountAmountCents: 0,
      shippingDiscountAmountCents: 0,
      freeShipping: false,
      lineItemDiscounts: [],
      freeItems: [],
      appliedPromotions: [],
    };

    try {
      // Fetch active promotions for cart/global scope, ordered by priority DESC
      const promotions = await this.promotionRepo.findActive(['cart', 'global'] as PromotionScope[]);

      if (promotions.length === 0) return result;

      // Also check for coupon-code-based promotions
      let couponPromotions: typeof promotions = [];
      if (context.couponCode) {
        couponPromotions = promotions.filter(
          p => (p as unknown as { code?: string }).code?.toUpperCase() === context.couponCode?.toUpperCase(),
        );
      }

      // Auto-applied promotions (no code required)
      const autoPromotions = promotions.filter(p => !(p as unknown as { code?: string }).code);

      // Combine: coupon promotions first, then auto-applied
      const candidates = [...couponPromotions, ...autoPromotions];

      // Phase 1: filter by validity and rule evaluation
      const matched: Array<{ promotion: Promotion; rules: PromotionRule[]; actions: PromotionAction[] }> = [];

      for (const promotion of candidates) {
        // Check basic validity
        if (!promotion.isActive) continue;
        if (promotion.status !== 'active') continue;
        if (promotion.maxUsage && promotion.usageCount >= promotion.maxUsage) continue;
        if (promotion.minOrderAmountCents && context.subtotalCents < Number(promotion.minOrderAmountCents)) continue;

        // Evaluate rules
        const rules = await this.promotionRepo.findRulesByPromotionId(promotion.promotionId);
        const rulesPassed = promotionRulesPass(rules, context);
        if (!rulesPassed) continue;

        // Get actions
        const actions = await this.promotionRepo.findActionsByPromotionId(promotion.promotionId);

        matched.push({ promotion, rules, actions });
      }

      if (matched.length === 0) return result;

      // Phase 2: resolve stacking — determine which matched promotions co-apply.
      // Decorate with stackability (fall back to isExclusive for backward compat).
      const stackable = sortByPriority(
        matched.map(m => ({
          ...m,
          stackability:
            (m.promotion as unknown as { stackability?: Stackability }).stackability ??
            (m.promotion.isExclusive ? 'exclusive' : 'stackable'),
          priority: m.promotion.priority ?? 0,
        })),
      );
      const resolved = resolveStackable(stackable);

      // Phase 3: apply actions for resolved promotions
      for (const entry of resolved) {
        const promotion = entry.promotion;
        const actions = entry.actions;

        const promoResult = applyPromotionActions(promotion, actions, context);

        if (promoResult.discountAmountCents > 0 || promoResult.freeShipping || promoResult.freeItems.length > 0) {
          result.totalDiscountAmountCents += promoResult.discountAmountCents;
          result.shippingDiscountAmountCents += promoResult.shippingDiscountAmountCents;
          result.freeShipping = result.freeShipping || promoResult.freeShipping;
          result.lineItemDiscounts.push(...promoResult.lineItemDiscounts);
          result.freeItems.push(...promoResult.freeItems);
          result.appliedPromotions.push({
            promotionId: promotion.promotionId,
            name: promotion.name,
            type: promotion.scope,
            discountAmountCents: promoResult.discountAmountCents,
          });

          // Check max discount cap
          if (promotion.maxDiscountAmountCents && result.totalDiscountAmountCents > Number(promotion.maxDiscountAmountCents)) {
            result.totalDiscountAmountCents = Number(promotion.maxDiscountAmountCents);
          }
        }
      }

      // Ensure total discount doesn't exceed subtotal
      if (result.totalDiscountAmountCents > context.subtotalCents) {
        result.totalDiscountAmountCents = context.subtotalCents;
      }
    } catch (error: unknown) {
      logger.warn(`EvaluatePromotions error: ${(error as Error).message}`);
    }

    return result;
  }
}
