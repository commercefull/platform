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
  unitPrice: number;
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
  shippingAmount: number;
  customerId?: string;
}

export interface TaxQuoteResult {
  success: boolean;
  taxAmount: number;
  breakdown?: Array<{ label: string; amount: number }>;
}

export interface TaxQuotePort {
  calculateTax(request: TaxQuoteRequest): Promise<TaxQuoteResult>;
  getTaxSettings(merchantId: string): Promise<{ applyDiscountBeforeTax: boolean; applyTaxToShipping: boolean } | null>;
}
