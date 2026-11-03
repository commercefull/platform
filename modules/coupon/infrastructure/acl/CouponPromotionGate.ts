/**
 * CouponPromotionGate
 *
 * ACL adapter owned by coupon. When a coupon is linked to a promotion
 * (`promotionCoupon.promotionId`), the linked promotion's rules gate
 * coupon eligibility — including store, channel, country, and currency
 * conditions. Coupons without a linked promotion remain eligible
 * subject to their own status/usage rules.
 *
 * Only this adapter may import from promotion's domain services.
 */

import { promotionRulesPass, type PromotionEvaluationContext } from '../../../promotion/domain/services/PromotionEvaluator';
import type { Promotion, PromotionRule } from '../../../promotion/domain/repositories/PromotionRepository';
import { logger } from '../../../../libs/logger';
import type {
  CouponEligibilityContext,
  CouponEligibilityPort,
  CouponEligibilityResult,
} from '../../application/ports/CouponEligibilityPort';

export type CouponPromotionGatePort = {
  findById(promotionId: string): Promise<Promotion | null>;
  findRulesByPromotionId(promotionId: string): Promise<PromotionRule[]>;
};

export class CouponPromotionGate implements CouponEligibilityPort {
  constructor(private readonly promotions: CouponPromotionGatePort) {}

  async isEligible(promotionId: string | undefined, context: CouponEligibilityContext): Promise<CouponEligibilityResult> {
    if (!promotionId) {
      return { eligible: true };
    }

    try {
      const promotion = await this.promotions.findById(promotionId);
      if (!promotion || !promotion.isActive || promotion.status !== 'active') {
        return { eligible: false, reason: 'The linked promotion is not active' };
      }

      const rules = await this.promotions.findRulesByPromotionId(promotionId);
      const evaluationContext: PromotionEvaluationContext = {
        items: (context.items || []).map(item => ({
          productId: item.productId,
          name: '',
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          categoryId: item.categoryId,
        })),
        subtotalCents: context.subtotalCents,
        shippingAmountCents: 0,
        customerId: context.customerId,
        storeId: context.storeId,
        channelId: context.channelId,
        countryCode: context.countryCode,
        currency: context.currency,
      };

      if (!promotionRulesPass(rules, evaluationContext)) {
        return { eligible: false, reason: 'Coupon is not eligible for this store, channel, country, or currency' };
      }

      return { eligible: true };
    } catch (error: unknown) {
      logger.warn('Coupon promotion eligibility check failed', {
        promotionId,
        error: (error as Error).message,
      });
      return { eligible: false, reason: 'Coupon eligibility could not be verified' };
    }
  }
}
