/**
 * CouponDiscountQuoteAdapter
 *
 * ACL adapter implementing basket's DiscountQuotePort.
 * Translates coupon's validation result into basket's DiscountQuote.
 *
 * When the coupon is linked to a promotion, eligibility is additionally
 * gated by that promotion's rules (store/channel/country/currency) via
 * CouponPromotionGate.
 *
 * Only this adapter may import from coupon's public API.
 */

import { DiscountQuoteContext, DiscountQuotePort, DiscountQuoteResult } from '../../application/ports/DiscountQuotePort';
import { CouponRepository } from '../../../coupon/infrastructure/repositories/CouponRepository';
import type { CouponPromotionGate } from '../../../coupon/infrastructure/acl/CouponPromotionGate';

export class CouponDiscountQuoteAdapter implements DiscountQuotePort {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly promotionGate?: CouponPromotionGate,
  ) {}

  async validateDiscount(code: string, subtotalCents: number, context?: DiscountQuoteContext): Promise<DiscountQuoteResult> {
    const validation = await this.couponRepository.validateCouponCode(code, subtotalCents, context?.customerId, context?.organizationId);

    if (!validation.valid || !validation.coupon) {
      return { valid: false, error: validation.error };
    }

    const gateError = await this.checkPromotionGate(validation.coupon.promotionId, subtotalCents, context);
    if (gateError) {
      return { valid: false, error: gateError };
    }

    return {
      valid: true,
      discount: {
        code,
        type: validation.coupon.type,
        value: validation.coupon.value,
        discountAmountCents: validation.discountAmountCents || 0,
      },
    };
  }

  /** Returns the ineligibility reason when the linked promotion gate rejects, else null. */
  private async checkPromotionGate(
    promotionId: string | undefined,
    subtotalCents: number,
    context?: DiscountQuoteContext,
  ): Promise<string | null> {
    if (!this.promotionGate || !promotionId) return null;
    const eligibility = await this.promotionGate.isEligible(promotionId, {
      subtotalCents,
      currency: context?.currency ?? 'USD',
      customerId: context?.customerId,
      storeId: context?.storeId,
      channelId: context?.channelId,
      countryCode: context?.countryCode,
      items: context?.items,
    });
    return eligibility.eligible ? null : (eligibility.reason ?? null);
  }
}
