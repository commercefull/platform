/**
 * CatalogPort — consumer-owned port onto the product module.
 * Implemented by infrastructure/acl/ProductCatalogAdapter. All prices are
 * integer cents; product ids stay opaque — no product-domain types cross
 * this boundary.
 */

export interface RecommendationCard {
  productId: string;
  name: string;
  slug: string;
  status: string;
  visibility: string;
  organizationId?: string;
  storeId?: string;
  effectivePriceCents: number;
  basePriceCents: number;
  salePriceCents: number | null;
  isOnSale: boolean;
  isFeatured: boolean;
  isInventoryManaged: boolean;
  /** Resolved via the inventory availability signal when available. */
  inStock?: boolean;
  primaryImageUrl?: string;
  currency?: string;
}

export interface CatalogFeatureRow {
  productId: string;
  organizationId: string | null;
  storeId: string | null;
  status: string;
  visibility: string;
  type: string;
  brandId: string | null;
  primaryCategoryId: string | null;
  secondaryCategoryIds: string[];
  collectionIds: string[];
  attributeValues: Array<{ attributeId: string; value: string }>;
  basePriceCents: number | null;
  averageRating: number | null;
  publishedAt: Date | null;
  isFeatured: boolean;
  isBestseller: boolean;
}

export interface ManualLink {
  productId: string;
  relatedProductId: string;
  type: string;
  position: number;
}

export interface CatalogPort {
  /** Batch card resolution for serving + eligibility. */
  getCards(
    productIds: string[],
    context?: { organizationId?: string; storeId?: string; currencyCode?: string },
  ): Promise<RecommendationCard[]>;

  /** Merchant-curated links for source products (S1). */
  getManualLinks(productIds: string[], types: string[]): Promise<ManualLink[]>;

  /** Cursor-paged catalog feature export for the nightly similar/rules resolvers. */
  listFeatures(
    organizationId: string | undefined,
    cursor: string | null,
    limit: number,
  ): Promise<{ features: CatalogFeatureRow[]; nextCursor: string | null }>;

  /** Primary category of a product (for popular-in-category fallback). */
  getPrimaryCategory(productId: string): Promise<string | null>;

  /** Accept a suggestion: create a manual link on the product side. */
  createManualLink(productId: string, relatedProductId: string, type: string, opts?: { isAutomated?: boolean }): Promise<void>;
}
