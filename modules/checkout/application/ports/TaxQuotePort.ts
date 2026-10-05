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
  /** Customer VAT ID (B2B) — enables intra-EU reverse-charge quoting. */
  vatNumber?: string;
  /** Seller organization — enables nexus coverage and VAT registration checks. */
  organizationId?: string;
  /** Seller/origin country (store country) — used to detect cross-border sales. */
  originCountry?: string;
}

export interface TaxQuoteResult {
  success: boolean;
  taxAmountCents: number;
  /** Portion of taxAmountCents added on top of subtotal+shipping (0 = fully tax-inclusive) */
  taxAddedCents?: number;
  /** True when taxAmountCents is embedded in the subtotal and must not be added again to the grand total */
  taxIncludedInSubtotal?: boolean;
  /** True when intra-EU B2B reverse charge applied — customer self-accounts VAT. */
  reverseChargeApplied?: boolean;
  breakdown?: Array<{ label: string; amountCents: number }>;
}

export interface TaxQuotePort {
  calculateTax(request: TaxQuoteRequest): Promise<TaxQuoteResult>;
  /** Validate a VAT ID's format for its country (extracted from the number prefix when countryCode omitted). */
  validateVatNumber?(vatNumber: string, countryCode?: string): boolean;
  getTaxSettings(
    merchantId: string,
  ): Promise<{ applyDiscountBeforeTax: boolean; applyTaxToShipping: boolean; pricesIncludeTax: boolean } | null>;
}
