/**
 * Coupon Eligibility Port
 *
 * Consumer-facing port for checking whether a coupon's linked promotion
 * allows redemption. Implemented by `infrastructure/acl/CouponPromotionGate`.
 */

export interface CouponEligibilityContext {
  subtotalCents: number;
  currency: string;
  customerId?: string;
  storeId?: string;
  channelId?: string;
  countryCode?: string;
  items?: Array<{
    productId: string;
    categoryId?: string;
    quantity: number;
    unitPriceCents: number;
  }>;
}

export interface CouponEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export interface CouponEligibilityPort {
  isEligible(promotionId: string | undefined, context: CouponEligibilityContext): Promise<CouponEligibilityResult>;
}
