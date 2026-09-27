/**
 * CoOccurrenceScorer — pure functions converting raw co-purchase counts
 * into support / confidence / lift metrics and ranking pairs.
 *
 * Given (for a fixed product A):
 *   coCountAB   decayed count of orders containing both A and B
 *   orderCountA decayed count of orders containing A
 *   orderCountB decayed count of orders containing B
 *   totalOrders decayed count of all orders in the tenant/store scope
 *
 *   support    = coCountAB  (decayed order count — interpretable for merchants)
 *   confidence = coCountAB / orderCountA           — P(B|A)
 *   expected   = orderCountB / totalOrders         — P(B)
 *   lift       = confidence / expected             — >1 means better than chance
 */

export interface CoPurchasePair {
  productId: string;
  relatedProductId: string;
  coCount: number;
}

export interface ScoredPair extends CoPurchasePair {
  support: number;
  confidence: number;
  lift: number;
}

export interface CoOccurrenceThresholds {
  minSupport: number;
  minLift: number;
}

export function scorePair(pair: CoPurchasePair, orderCountA: number, orderCountB: number, totalOrders: number): ScoredPair {
  const confidence = orderCountA > 0 ? pair.coCount / orderCountA : 0;
  const expected = totalOrders > 0 ? orderCountB / totalOrders : 0;
  const lift = expected > 0 ? confidence / expected : 0;
  return { ...pair, support: pair.coCount, confidence, lift };
}

export function passesThresholds(scored: ScoredPair, thresholds: CoOccurrenceThresholds): boolean {
  return scored.support >= thresholds.minSupport && scored.lift >= thresholds.minLift;
}

/**
 * Score a product's candidate pairs and keep the top N passing thresholds.
 * Ordering: confidence desc, then lift desc, then support desc — stable and
 * deterministic for equal scores.
 */
export function rankCoPurchases(
  pairs: CoPurchasePair[],
  orderCountOf: (productId: string) => number,
  totalOrders: number,
  thresholds: CoOccurrenceThresholds,
  topN: number,
): ScoredPair[] {
  return pairs
    .map(p => scorePair(p, orderCountOf(p.productId), orderCountOf(p.relatedProductId), totalOrders))
    .filter(s => passesThresholds(s, thresholds))
    .sort(
      (a, b) =>
        b.confidence - a.confidence || b.lift - a.lift || b.support - a.support || a.relatedProductId.localeCompare(b.relatedProductId),
    )
    .slice(0, topN);
}

/** Nightly decay multiplier for a given half-life in days. */
export function decayFactor(halfLifeDays: number): number {
  if (halfLifeDays <= 0) return 1;
  return Math.pow(0.5, 1 / halfLifeDays);
}
