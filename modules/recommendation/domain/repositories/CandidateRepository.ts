/**
 * CandidateRepository — the serving read models:
 * `recommendationCandidate` (per-product ranked candidates, source =
 * rule|fbt|similar|coView) and `recommendationPopular` (S6 ranked lists).
 */

import type {
  CandidateSource,
  RecommendationCandidateInsert,
  RecommendationCandidateProps,
  RecommendationRelationType,
} from '../entities/RecommendationCandidate';
import type { SignalScope } from './CoPurchaseRepository';

export interface PopularRow {
  scope: 'overall' | 'category';
  categoryId: string | null;
  productId: string;
  rank: number;
  score: number;
}

export interface CandidateRepository {
  /** Serving lookup: candidates for products, ranked by score desc. */
  listForProducts(
    scope: SignalScope,
    productIds: string[],
    opts?: { source?: CandidateSource; relationType?: RecommendationRelationType; limit?: number },
  ): Promise<RecommendationCandidateProps[]>;

  /** Suggestions panel: all candidates for one product with source+reason. */
  listSuggestions(scope: SignalScope, productId: string, limit?: number): Promise<RecommendationCandidateProps[]>;

  /** Replace a product's candidates for one source (nightly rebuild). */
  replaceForSource(scope: SignalScope, source: CandidateSource, rows: RecommendationCandidateInsert[], runStartedAt: Date): Promise<void>;

  /** Popularity fallback list. */
  listPopular(scope: SignalScope, popularScope: 'overall' | 'category', categoryId: string | null, limit: number): Promise<PopularRow[]>;
  replacePopular(scope: SignalScope, popularScope: 'overall' | 'category', categoryId: string | null, rows: PopularRow[]): Promise<void>;

  /** Drop candidates pointing to / from a product (deleted/unpublished). */
  deleteForProduct(organizationId: string, productId: string): Promise<void>;

  /** Stats card: counts for the merchant dashboard. */
  getStats(scope: SignalScope): Promise<{ productsWithFbt: number; lastRebuiltAt: Date | null; ordersCounted: number }>;
  setLastRebuiltAt(scope: SignalScope, at: Date): Promise<void>;
}
