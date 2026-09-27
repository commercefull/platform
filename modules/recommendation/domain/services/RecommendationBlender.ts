/**
 * RecommendationBlender — pure waterfall blending (spec §7).
 *
 * Each placement supplies an ordered list of source fetches. The blender
 * walks them in order, dedupes candidate product ids (source products and
 * basket items are always excluded up front), over-fetches for eligibility
 * filtering, then applies eligibility and the final limit.
 *
 * For multi-product sources (cartAddOns) the candidate score aggregates:
 * Σ score over every source product that recommends it — a candidate
 * suggested by two of three cart items outranks one suggested by one.
 */

import type { CandidateReason, CandidateSource } from '../entities/RecommendationCandidate';
import type { PlacementSource } from '../valueObjects/Placement';

export interface BlendCandidate {
  productId: string;
  /** which source in the waterfall produced it */
  source: PlacementSource;
  /** candidate source as stored ('manual' maps from the placement source) */
  candidateSource: CandidateSource | 'manual';
  score: number;
  relationType?: string;
  reason?: CandidateReason;
}

export interface BlendInput {
  /** productIds the recommendation is about (PDP product or basket contents) */
  sourceProductIds: string[];
  /** waterfall: resolved candidates per source step, already ranked */
  steps: Array<{ source: PlacementSource; candidates: BlendCandidate[] }>;
}

/**
 * Walk the waterfall in order and collect unique candidates. Aggregates
 * scores when several source products recommend the same candidate.
 * Stops early once `target` unique candidates are collected.
 */
export function blend(input: BlendInput, target: number): BlendCandidate[] {
  const excluded = new Set(input.sourceProductIds);
  const picked = new Map<string, BlendCandidate>();

  for (const step of input.steps) {
    // Aggregate per-candidate score across the source products that produced it
    const byCandidate = new Map<string, BlendCandidate>();
    for (const c of step.candidates) {
      if (excluded.has(c.productId)) continue;
      const existing = byCandidate.get(c.productId);
      if (existing) {
        existing.score += c.score;
      } else {
        byCandidate.set(c.productId, { ...c });
      }
    }
    const ranked = [...byCandidate.values()].sort((a, b) => b.score - a.score || a.productId.localeCompare(b.productId));
    for (const c of ranked) {
      if (picked.has(c.productId)) continue;
      picked.set(c.productId, c);
      if (picked.size >= target) return [...picked.values()];
    }
  }
  return [...picked.values()];
}

export interface EligibilityContext {
  /** products the shopper already has (source product + basket items) */
  excludeProductIds: Set<string>;
  /** pair + global exclusions for the source product(s), resolved outside */
  excludedPairs: Set<string>; // `${productId}` global or `${sourceId}:${productId}` pair
  globalExclusions: Set<string>;
  hideOutOfStock: boolean;
}

export interface EligibleCard {
  productId: string;
  status: string;
  visibility: string;
  isInventoryManaged?: boolean;
  inStock?: boolean;
  organizationId?: string;
  storeId?: string;
}

/**
 * Post-blend eligibility filter (spec §7.2). Cards that fail lookup are
 * dropped — an unresolvable id can't be rendered anyway.
 */
export function applyEligibility<T extends EligibleCard>(
  picked: BlendCandidate[],
  cards: T[],
  ctx: EligibilityContext,
  sourceProductId?: string,
): Array<BlendCandidate & { card: T }> {
  const cardById = new Map(cards.map(c => [c.productId, c]));
  const out: Array<BlendCandidate & { card: T }> = [];

  for (const p of picked) {
    if (ctx.excludeProductIds.has(p.productId)) continue;
    if (ctx.globalExclusions.has(p.productId)) continue;
    if (sourceProductId && ctx.excludedPairs.has(`${sourceProductId}:${p.productId}`)) continue;
    if (ctx.excludedPairs.has(`*:${p.productId}`)) continue;

    const card = cardById.get(p.productId);
    if (!card) continue;
    if (card.status !== 'active') continue;
    if (card.visibility !== 'visible' && card.visibility !== 'featured' && card.visibility !== 'catalog') continue;
    if (ctx.hideOutOfStock && card.isInventoryManaged && card.inStock === false) continue;

    out.push({ ...p, card });
  }
  return out;
}
