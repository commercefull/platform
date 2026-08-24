/**
 * CouponDiscountQuoteAdapter
 *
 * ACL adapter implementing checkout's DiscountQuotePort.
 * Translates coupon's validation result into checkout's DiscountQuote.
 */

import { DiscountQuotePort, DiscountQuoteResult } from '../../application/ports/DiscountQuotePort';
import { CouponRepository } from '../../../coupon/infrastructure/repositories/CouponRepository';

export class CouponDiscountQuoteAdapter implements DiscountQuotePort {
  constructor(private readonly couponRepository: CouponRepository) {}

  async validateDiscount(code: string, subtotal: number, _currency: string): Promise<DiscountQuoteResult> {
    const validation = await this.couponRepository.validateCouponCode(code, subtotal);

    if (!validation.valid || !validation.coupon) {
      return { valid: false, error: validation.error };
    }

    return {
      valid: true,
      discount: {
        code,
        discountAmount: validation.discountAmount || 0,
      },
    };
  }
}
