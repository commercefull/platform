/**
 * SubscriptionTaxPort
 *
 * ACL port owned by subscription. Quotes tax for a subscription's
 * recurring price against the subscriber's destination, mirroring the
 * tax context used by one-time checkout.
 */

export interface SubscriptionTaxRequest {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  destination: {
    country: string;
    region?: string;
    postalCode?: string;
    city?: string;
  };
  customerId?: string;
  /** Customer VAT ID (B2B) — enables intra-EU reverse-charge quoting. */
  vatNumber?: string;
  /** Seller organization — enables nexus coverage and VAT registration checks. */
  organizationId?: string;
  /** Seller/origin country (store country). */
  originCountry?: string;
}

export interface SubscriptionTaxQuote {
  success: boolean;
  taxAmountCents: number;
  /** Portion of taxAmountCents added on top of the subtotal (0 = fully tax-inclusive). */
  taxAddedCents?: number;
  taxIncludedInSubtotal?: boolean;
  reverseChargeApplied?: boolean;
}

export interface SubscriptionTaxPort {
  quoteSubscriptionTax(request: SubscriptionTaxRequest): Promise<SubscriptionTaxQuote>;
}
