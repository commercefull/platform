/**
 * SimilarityScorer — pure content-based similarity between catalog feature
 * rows. Weights mirror spec §4 S4: same primary category and brand dominate,
 * shared secondary categories / collections / attribute values add up, and
 * a similar price band adds a small bonus.
 */

export interface SimilarityFeatures {
  productId: string;
  primaryCategoryId: string | null;
  secondaryCategoryIds: string[];
  collectionIds: string[];
  brandId: string | null;
  attributeValues: Array<{ attributeId: string; value: string }>;
  basePriceCents: number | null;
}

export interface SimilarityWeights {
  samePrimaryCategory: number;
  perSharedSecondaryCategory: number;
  maxSecondaryCategoryBonus: number;
  sameBrand: number;
  perSharedCollection: number;
  maxCollectionBonus: number;
  perSharedAttributeValue: number;
  maxAttributeBonus: number;
  similarPriceBonus: number;
}

export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
  samePrimaryCategory: 10,
  perSharedSecondaryCategory: 3,
  maxSecondaryCategoryBonus: 6,
  sameBrand: 8,
  perSharedCollection: 3,
  maxCollectionBonus: 6,
  perSharedAttributeValue: 1,
  maxAttributeBonus: 10,
  similarPriceBonus: 2,
};

/** Products whose prices differ by at most this fraction count as "similar price". */
export function similarPriceBand(basePriceCents: number, bandPct: number): { min: number; max: number } {
  const band = basePriceCents * (bandPct / 100);
  return { min: basePriceCents - band, max: basePriceCents + band };
}

export function similarityScore(
  a: SimilarityFeatures,
  b: SimilarityFeatures,
  weights: SimilarityWeights = DEFAULT_SIMILARITY_WEIGHTS,
  priceBandPct: number = 25,
): number {
  let score = 0;

  if (a.primaryCategoryId && a.primaryCategoryId === b.primaryCategoryId) {
    score += weights.samePrimaryCategory;
  }

  const bSecondary = new Set(b.secondaryCategoryIds);
  const sharedCategories = a.secondaryCategoryIds.filter(c => bSecondary.has(c)).length;
  score += Math.min(sharedCategories * weights.perSharedSecondaryCategory, weights.maxSecondaryCategoryBonus);

  if (a.brandId && a.brandId === b.brandId) {
    score += weights.sameBrand;
  }

  const bCollections = new Set(b.collectionIds);
  const sharedCollections = a.collectionIds.filter(c => bCollections.has(c)).length;
  score += Math.min(sharedCollections * weights.perSharedCollection, weights.maxCollectionBonus);

  const bAttrs = new Set(b.attributeValues.map(av => `${av.attributeId}:${av.value}`));
  const sharedAttrs = a.attributeValues.filter(av => bAttrs.has(`${av.attributeId}:${av.value}`)).length;
  score += Math.min(sharedAttrs * weights.perSharedAttributeValue, weights.maxAttributeBonus);

  if (a.basePriceCents !== null && b.basePriceCents !== null) {
    const band = similarPriceBand(a.basePriceCents, priceBandPct);
    if (b.basePriceCents >= band.min && b.basePriceCents <= band.max) {
      score += weights.similarPriceBonus;
    }
  }

  return score;
}

/**
 * Rank a source product's similarity candidates. Only pairs inside the same
 * primary-category bucket (or the same brand) are scored — keeps the nightly
 * job linear-ish per spec §4 S4.
 */
export function rankSimilarProducts(
  source: SimilarityFeatures,
  candidates: SimilarityFeatures[],
  minScore: number,
  topN: number,
  weights: SimilarityWeights = DEFAULT_SIMILARITY_WEIGHTS,
  priceBandPct: number = 25,
): Array<{ productId: string; score: number }> {
  return candidates
    .filter(c => c.productId !== source.productId)
    .filter(
      c =>
        (source.primaryCategoryId !== null && c.primaryCategoryId === source.primaryCategoryId) ||
        (source.brandId !== null && c.brandId === source.brandId),
    )
    .map(c => ({ productId: c.productId, score: similarityScore(source, c, weights, priceBandPct) }))
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score || a.productId.localeCompare(b.productId))
    .slice(0, topN);
}
