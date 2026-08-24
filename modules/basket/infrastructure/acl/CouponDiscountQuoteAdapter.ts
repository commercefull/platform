/**
 * CouponDiscountQuoteAdapter
 *
 * ACL adapter implementing basket's DiscountQuotePort.
 * Translates coupon's validation result into basket's DiscountQuote.
 *
 * Only this adapter may import from coupon's public API.
 */

import { DiscountQuotePort, DiscountQuoteResult } from '../../application/ports/DiscountQuotePort';
import { CouponRepository } from '../../../coupon/infrastructure/repositories/CouponRepository';

export class CouponDiscountQuoteAdapter implements DiscountQuotePort {
  constructor(private readonly couponRepository: CouponRepository) {}

  async validateDiscount(code: string, subtotal: number, customerId?: string): Promise<DiscountQuoteResult> {
    const validation = await this.couponRepository.validateCouponCode(code, subtotal, customerId);

    if (!validation.valid || !validation.coupon) {
      return { valid: false, error: validation.error };
    }

    return {
      valid: true,
      discount: {
        code,
        type: validation.coupon.type,
        value: validation.coupon.value,
        discountAmount: validation.discountAmount || 0,
      },
    };
  }
}
