/**
 * CatalogFeature — compact read-model row exposing everything an external
 * consumer (recommendation engine, feed, indexer) needs to reason about a
 * product without touching catalog tables directly.
 *
 * Produced by `ProductRepository.listCatalogFeatureRows` and served through
 * `ListCatalogFeaturesUseCase`. Prices are integer cents.
 */

export interface CatalogFeatureAttributeValue {
  attributeId: string;
  value: string;
}

export interface CatalogFeature {
  productId: string;
  organizationId: string | null;
  storeId: string | null;
  status: string;
  visibility: string;
  /** Product type code: simple | configurable | grouped | … */
  type: string;
  brandId: string | null;
  primaryCategoryId: string | null;
  secondaryCategoryIds: string[];
  collectionIds: string[];
  attributeValues: CatalogFeatureAttributeValue[];
  /** Product-level base price in integer cents (null when unpriced). */
  basePriceCents: number | null;
  averageRating: number | null;
  publishedAt: Date | null;
  isFeatured: boolean;
  isBestseller: boolean;
}
