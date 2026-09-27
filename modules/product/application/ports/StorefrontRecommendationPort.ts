/**
 * StorefrontRecommendationPort — consumer-owned port for optional
 * storefront recommendation slots (PDP rails, cart add-ons).
 * Implemented by infrastructure/acl/StorefrontRecommendationAdapter, which
 * bridges to the recommendation module when it is enabled — and returns
 * empty lists otherwise, so the PDP falls back to curated links +
 * category heuristics.
 *
 * Item shape mirrors the product-card partial fields.
 */

export interface StorefrontRecommendationItem {
  productId: string;
  name: string;
  slug: string;
  primaryImageUrl?: string;
  basePriceCents: number;
  salePriceCents: number | null;
  effectivePriceCents: number;
  isOnSale: boolean;
  currency?: string;
  source?: string;
}

export interface StorefrontRecommendationContext {
  organizationId?: string;
  storeId?: string;
  currencyCode?: string;
}

export interface StorefrontRecommendationPort {
  /** Resolve a placement (e.g. 'pdpAlsoLike', 'pdpBoughtWith') for source products. */
  getForPlacement(
    placement: string,
    productIds: string[],
    context: StorefrontRecommendationContext,
    limit?: number,
  ): Promise<StorefrontRecommendationItem[]>;
}

/** Default when no recommendation provider is wired. */
export class NullStorefrontRecommendationPort implements StorefrontRecommendationPort {
  async getForPlacement(): Promise<StorefrontRecommendationItem[]> {
    return [];
  }
}
