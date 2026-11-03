/**
 * CouponDiscountQuoteAdapter
 *
 * ACL adapter implementing checkout's DiscountQuotePort.
 * Translates coupon's validation result into checkout's DiscountQuote.
 *
 * When the coupon is linked to a promotion, eligibility is additionally
 * gated by that promotion's rules (store/channel/country/currency) via
 * CouponPromotionGate.
 */

import { DiscountQuoteContext, DiscountQuotePort, DiscountQuoteResult } from '../../application/ports/DiscountQuotePort';
import type { CouponRepository } from '../../../coupon';
import type { CouponEligibilityPort } from '../../../coupon';

export class CouponDiscountQuoteAdapter implements DiscountQuotePort {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly promotionGate?: Pick<CouponEligibilityPort, 'isEligible'>,
  ) {}

  async validateDiscount(
    code: string,
    subtotalCents: number,
    currency: string,
    context?: DiscountQuoteContext,
  ): Promise<DiscountQuoteResult> {
    const validation = await this.couponRepository.validateCouponCode(code, subtotalCents, context?.customerId, context?.organizationId);

    if (!validation.valid || !validation.coupon) {
      return { valid: false, error: validation.error };
    }

    if (this.promotionGate && validation.coupon.promotionId) {
      const eligibility = await this.promotionGate.isEligible(validation.coupon.promotionId, {
        subtotalCents,
        currency,
        customerId: context?.customerId,
        storeId: context?.storeId,
        channelId: context?.channelId,
        countryCode: context?.countryCode,
        items: context?.items,
      });

      if (!eligibility.eligible) {
        return { valid: false, error: eligibility.reason };
      }
    }

    return {
      valid: true,
      discount: {
        code,
        discountAmountCents: validation.discountAmountCents || 0,
      },
    };
  }
}
