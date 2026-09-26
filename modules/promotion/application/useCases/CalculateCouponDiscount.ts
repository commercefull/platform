/**
 * Calculate Coupon Discount Use Case
 * Loads a coupon by code and computes the discounted cart total.
 */

import type { CouponRepository, PromotionCoupon } from '../../domain/repositories/CouponRepository';
import { CouponNotFoundError, PromotionValidationError } from '../../domain/errors/PromotionErrors';

export type CalculateCouponDiscountPort = Pick<CouponRepository, 'findByCode' | 'calculateDiscount'>;

export interface CalculateCouponDiscountCommand {
  code: string;
  orderTotalCents: string;
  organizationId?: string;
}

export interface CalculateCouponDiscountResponse {
  coupon: PromotionCoupon;
  orderTotalCents: number;
  discountAmountCents: number;
  finalTotalCents: number;
}

export class CalculateCouponDiscountUseCase {
  constructor(private readonly coupons: CalculateCouponDiscountPort) {}

  async execute(command: CalculateCouponDiscountCommand): Promise<CalculateCouponDiscountResponse> {
    if (!command.code || command.orderTotalCents === undefined) {
      throw new PromotionValidationError('Coupon code and order total are required');
    }

    const coupon = await this.coupons.findByCode(command.code, command.organizationId);
    if (!coupon) {
      throw new CouponNotFoundError(command.code);
    }

    const orderTotalCents = parseFloat(command.orderTotalCents);
    const discountAmountCents = this.coupons.calculateDiscount(coupon, orderTotalCents);

    return {
      coupon,
      orderTotalCents,
      discountAmountCents,
      finalTotalCents: orderTotalCents - discountAmountCents,
    };
  }
}
