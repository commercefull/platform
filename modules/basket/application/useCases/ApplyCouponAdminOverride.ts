import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { Basket } from '../../domain/entities/Basket';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';
import { DiscountQuotePort } from '../ports/DiscountQuotePort';

/**
 * Lookup port for raw coupon details used by the admin override path.
 * Returns the coupon's discount type and value when the coupon exists,
 * is active, and not expired; null otherwise.
 */
export interface CouponOverrideLookupPort {
  findActiveCoupon(code: string): Promise<{ type: string; discountValue: number } | null>;
}

/**
 * Admin override: apply a coupon without strict customer validations.
 * Tries the discount validation port first; falls back to a direct coupon
 * lookup; finally applies a default percentage discount.
 */
export class ApplyCouponAdminOverrideUseCase {
  constructor(
    private readonly basketRepository: BasketRepository,
    private readonly discountQuotePort: DiscountQuotePort,
    private readonly couponLookupPort: CouponOverrideLookupPort,
  ) {}

  async execute(basketId: string, couponCode: string): Promise<Basket> {
    const basket = await this.basketRepository.findById(basketId);
    if (!basket) {
      throw new BasketNotFoundError(basketId);
    }

    let discountType: 'fixed' | 'percentage' = 'percentage';
    let discountValue = 0;

    try {
      const validation = await this.discountQuotePort.validateDiscount(couponCode, basket.subtotal.cents, basket.customerId);
      if (validation.valid && validation.discount) {
        discountType = validation.discount.type === 'fixed_amount' ? 'fixed' : 'percentage';
        discountValue = validation.discount.value;
      }
    } catch {
      const coupon = await this.couponLookupPort.findActiveCoupon(couponCode);
      if (coupon) {
        discountType = coupon.type === 'fixedAmount' || coupon.type === 'fixed_amount' ? 'fixed' : 'percentage';
        discountValue = coupon.discountValue;
      }
    }

    if (discountValue === 0 && discountType === 'percentage') {
      // If we couldn't find the coupon, still apply a default for admin override
      discountValue = 10;
    }

    basket.applyCoupon(couponCode, discountType, discountValue);
    return this.basketRepository.save(basket);
  }
}
