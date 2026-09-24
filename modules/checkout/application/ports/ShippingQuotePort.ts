/**
 * ShippingQuotePort
 *
 * ACL port owned by checkout. Returns available shipping options
 * for a checkout session in checkout's vocabulary.
 */

export interface ShippingOption {
  methodId: string;
  methodName: string;
  amountCents: number;
  currency: string;
  estimatedDays?: number;
  carrier?: string;
}

export interface ShippingQuoteRequest {
  basketId: string;
  shippingAddress: {
    country: string;
    region?: string;
    postalCode?: string;
    city?: string;
  };
  totalWeight?: number;
  totalValueCents?: number;
}

export interface ShippingQuotePort {
  getShippingOptions(request: ShippingQuoteRequest): Promise<ShippingOption[]>;
}
