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
  /** When true, item/shipping prices already include tax — the quote extracts the embedded tax instead of adding it */
  pricesIncludeTax?: boolean;
}

export interface TaxQuoteResult {
  success: boolean;
  taxAmountCents: number;
  /** True when taxAmountCents is embedded in the subtotal and must not be added again to the grand total */
  taxIncludedInSubtotal?: boolean;
  breakdown?: Array<{ label: string; amountCents: number }>;
}

export interface TaxQuotePort {
  calculateTax(request: TaxQuoteRequest): Promise<TaxQuoteResult>;
  getTaxSettings(
    merchantId: string,
  ): Promise<{ applyDiscountBeforeTax: boolean; applyTaxToShipping: boolean; pricesIncludeTax: boolean } | null>;
}
