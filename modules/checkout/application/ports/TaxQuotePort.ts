/**
 * TaxQuotePort
 *
 * ACL port owned by checkout. Calculates tax for a checkout session
 * based on line items and shipping address, returning a tax quote
 * in checkout's vocabulary.
 */

export interface TaxLineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  taxCategoryId?: string;
  taxable?: boolean;
}

export interface TaxQuoteRequest {
  items: TaxLineItem[];
  shippingAddress: {
    country: string;
    region?: string;
    postalCode?: string;
    city?: string;
  };
  shippingAmountCents: number;
  customerId?: string;
}

export interface TaxQuoteResult {
  success: boolean;
  taxAmountCents: number;
  breakdown?: Array<{ label: string; amountCents: number }>;
}

export interface TaxQuotePort {
  calculateTax(request: TaxQuoteRequest): Promise<TaxQuoteResult>;
  getTaxSettings(merchantId: string): Promise<{ applyDiscountBeforeTax: boolean; applyTaxToShipping: boolean } | null>;
}
