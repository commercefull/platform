/**
 * DiscountQuotePort
 *
 * ACL port owned by checkout. Validates a discount code and returns
 * a quote in checkout's vocabulary — not a coupon entity.
 */

export interface DiscountQuote {
  code: string;
  discountAmount: number;
  reason?: string;
}

export interface DiscountQuoteResult {
  valid: boolean;
  discount?: DiscountQuote;
  error?: string;
}

export interface DiscountQuotePort {
  validateDiscount(code: string, subtotal: number, currency: string): Promise<DiscountQuoteResult>;
}
