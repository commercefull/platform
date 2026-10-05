/**
 * CouponRedemptionPort
 *
 * ACL port owned by checkout. Finalizes coupon usage when a checkout
 * completes successfully — records the redemption and increments
 * usage counters so single-use and limited coupons deplete.
 */

export interface CouponRedemptionRequest {
  couponCode: string;
  orderId: string;
  customerId?: string;
  discountAmountCents: number;
  currencyCode: string;
}

export interface CouponRedemptionPort {
  redeemCoupon(request: CouponRedemptionRequest): Promise<void>;
}
