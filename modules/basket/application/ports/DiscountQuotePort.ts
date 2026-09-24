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

export interface DiscountQuotePort {
  validateDiscount(code: string, subtotalCents: number, customerId?: string): Promise<DiscountQuoteResult>;
}
