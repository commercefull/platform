/**
 * DiscountQuotePort
 *
 * ACL port owned by basket. Validates a discount code and returns
 * a quote in basket's vocabulary — not a coupon entity.
 */

export interface DiscountQuote {
  code: string;
  type: string;
  value: number;
  discountAmount: number;
}

export interface DiscountQuoteResult {
  valid: boolean;
  discount?: DiscountQuote;
  error?: string;
}

export interface DiscountQuotePort {
  validateDiscount(code: string, subtotal: number, customerId?: string): Promise<DiscountQuoteResult>;
}
