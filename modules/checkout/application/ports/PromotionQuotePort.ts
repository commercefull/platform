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
    unitPrice: number;
    isDigital: boolean;
  }>;
  subtotal: number;
  shippingAmount: number;
  customerId?: string;
  currency: string;
  couponCode?: string;
}

export interface PromotionQuoteResult {
  totalDiscountAmount: number;
  appliedPromotions: Array<{ id: string; name: string; amount: number }>;
}

export interface PromotionQuotePort {
  evaluatePromotions(request: PromotionQuoteRequest): Promise<PromotionQuoteResult>;
}
