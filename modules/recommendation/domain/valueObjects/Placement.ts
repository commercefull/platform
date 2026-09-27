/**
 * Placement — a named recommendation slot on a page. Each placement has an
 * ordered waterfall of sources: the blender fills slots from the first
 * source, dedupes, then moves down the list until `limit` is reached.
 *
 * 'manual' is special: it resolves merchant-curated `productRelated` links
 * through the catalog port rather than the candidate table.
 */

export type PlacementSource = 'manual' | 'rule' | 'fbt' | 'similar' | 'coView' | 'popular';

export interface PlacementPlan {
  sources: PlacementSource[];
  limit: number;
  /** relationTypes the manual/rule sources should pull */
  relationTypes: string[];
  /** only for popular fallback */
  popularScope: 'overall' | 'category';
}

export type PlacementId = 'pdpAlsoLike' | 'pdpBoughtWith' | 'pdpUpgrade' | 'cartAddOns' | 'emptyState' | 'postPurchase';

export const PLACEMENTS: Record<PlacementId, PlacementPlan> = {
  pdpAlsoLike: {
    sources: ['manual', 'rule', 'similar', 'coView', 'popular'],
    limit: 8,
    relationTypes: ['related'],
    popularScope: 'category',
  },
  pdpBoughtWith: {
    sources: ['manual', 'rule', 'fbt'],
    limit: 3,
    relationTypes: ['accessory', 'cross_sell'],
    popularScope: 'overall',
  },
  pdpUpgrade: {
    sources: ['manual', 'rule', 'similar'],
    limit: 3,
    relationTypes: ['up_sell'],
    popularScope: 'category',
  },
  cartAddOns: {
    sources: ['manual', 'fbt', 'popular'],
    limit: 4,
    relationTypes: ['cross_sell', 'accessory'],
    popularScope: 'overall',
  },
  emptyState: {
    sources: ['popular'],
    limit: 8,
    relationTypes: [],
    popularScope: 'overall',
  },
  postPurchase: {
    sources: ['manual', 'fbt', 'popular'],
    limit: 4,
    relationTypes: ['cross_sell', 'accessory'],
    popularScope: 'overall',
  },
};

export function isPlacementId(value: string): value is PlacementId {
  return value in PLACEMENTS;
}
