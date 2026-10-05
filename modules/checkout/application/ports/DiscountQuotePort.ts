/**
 * DiscountQuotePort
 *
 * ACL port owned by checkout. Validates a discount code and returns
 * a quote in checkout's vocabulary — not a coupon entity.
 */

export interface DiscountQuote {
  code: string;
  discountAmountCents: number;
  reason?: string;
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
  items?: Array<{
    productId: string;
    categoryId?: string;
    quantity: number;
    unitPriceCents: number;
  }>;
}

export interface DiscountQuotePort {
  validateDiscount(code: string, subtotalCents: number, currency: string, context?: DiscountQuoteContext): Promise<DiscountQuoteResult>;
}
