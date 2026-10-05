/**
 * DiscountQuotePort
 *
 * ACL port owned by basket. Validates a discount code and returns
 * a quote in basket's vocabulary — not a coupon entity.
 */

export interface DiscountQuote {
  code: string;
  type: string;
  /** Polymorphic operand: percentage points or integer cents depending on type. */
  value: number;
  /** Computed discount amount in integer cents. */
  discountAmountCents: number;
}

export interface DiscountQuoteResult {
  valid: boolean;
  discount?: DiscountQuote;
  error?: string;
}

/**
 * Contextual eligibility data for scoped coupons — a coupon linked to a
 * promotion inherits that promotion's store/channel/country/currency rules.
 */
export interface DiscountQuoteContext {
  customerId?: string;
  organizationId?: string;
  storeId?: string;
  channelId?: string;
  countryCode?: string;
  currency?: string;
  items?: Array<{
    productId: string;
    categoryId?: string;
    quantity: number;
    unitPriceCents: number;
  }>;
}

export interface DiscountQuotePort {
  validateDiscount(code: string, subtotalCents: number, context?: DiscountQuoteContext): Promise<DiscountQuoteResult>;
}
