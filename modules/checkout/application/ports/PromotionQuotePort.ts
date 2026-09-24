/**
 * PromotionQuotePort
 *
 * ACL port owned by checkout. Evaluates promotions for a checkout
 * session and returns discount amounts in checkout's vocabulary.
 */

export interface PromotionQuoteRequest {
  items: Array<{
    productId: string;
    productVariantId?: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    isDigital: boolean;
  }>;
  subtotalCents: number;
  shippingAmountCents: number;
  customerId?: string;
  currency: string;
  couponCode?: string;
}

export interface PromotionQuoteResult {
  totalDiscountAmountCents: number;
  appliedPromotions: Array<{ id: string; name: string; amountCents: number }>;
}

export interface PromotionQuotePort {
  evaluatePromotions(request: PromotionQuoteRequest): Promise<PromotionQuoteResult>;
}
