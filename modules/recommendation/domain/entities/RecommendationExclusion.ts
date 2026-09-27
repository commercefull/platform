/**
 * RecommendationExclusion — "never recommend B on A" (scope 'pair') or
 * "never recommend B anywhere" (scope 'global'). Created when a merchant
 * hides a suggestion, or explicitly.
 */

export type ExclusionScope = 'pair' | 'global';

export interface RecommendationExclusionProps {
  recommendationExclusionId: string;
  organizationId: string;
  storeId: string | null;
  productId: string;
  excludedProductId: string;
  scope: ExclusionScope;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RecommendationExclusionCreateProps = Omit<
  RecommendationExclusionProps,
  'recommendationExclusionId' | 'createdAt' | 'updatedAt'
>;
