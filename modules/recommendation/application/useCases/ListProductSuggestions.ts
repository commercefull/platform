/**
 * List Product Suggestions Use Case — the merchant "Suggested for this
 * product" panel (spec §8.2): candidates with source and reason, minus
 * pairs the merchant already linked or excluded.
 *
 * Accept converts a suggestion into a curated productRelated link
 * (isAutomated = true — pinned, never overwritten by the rebuild).
 * Hide creates a pair exclusion.
 */

import type { CandidateRepository } from '../../domain/repositories/CandidateRepository';
import type { ExclusionRepository } from '../../domain/repositories/RuleRepository';
import type { CatalogPort } from '../ports/CatalogPort';
import type { CandidateReason, CandidateSource } from '../../domain/entities/RecommendationCandidate';
import { RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

export interface ProductSuggestion {
  candidateProductId: string;
  name?: string;
  slug?: string;
  source: CandidateSource;
  score: number;
  reason: CandidateReason | null;
}

export class ListProductSuggestionsUseCase {
  constructor(
    private readonly candidates: CandidateRepository,
    private readonly exclusions: ExclusionRepository,
    private readonly catalog: CatalogPort,
  ) {}

  async list(organizationId: string, productId: string, limit = 20): Promise<ProductSuggestion[]> {
    const scope = { organizationId, storeId: null };
    const [rows, exclusionRows, manualLinks] = await Promise.all([
      this.candidates.listSuggestions(scope, productId, limit * 2),
      this.exclusions.listForProducts(scope, [productId]),
      this.catalog.getManualLinks([productId], ['related', 'accessory', 'cross_sell', 'up_sell']),
    ]);

    const hidden = new Set(exclusionRows.map(e => `${e.productId}:${e.excludedProductId}`));
    const globalHidden = new Set(exclusionRows.filter(e => e.scope === 'global').map(e => e.excludedProductId));
    const alreadyLinked = new Set(manualLinks.map(l => l.relatedProductId));

    const filtered = rows.filter(r => {
      if (alreadyLinked.has(r.candidateProductId)) return false;
      if (globalHidden.has(r.candidateProductId)) return false;
      return !hidden.has(`${r.productId}:${r.candidateProductId}`);
    });

    const cards = await this.catalog.getCards(
      filtered.slice(0, limit).map(r => r.candidateProductId),
      { organizationId },
    );
    const cardById = new Map(cards.map(c => [c.productId, c]));

    return filtered.slice(0, limit).map(r => ({
      candidateProductId: r.candidateProductId,
      name: cardById.get(r.candidateProductId)?.name,
      slug: cardById.get(r.candidateProductId)?.slug,
      source: r.source,
      score: r.score,
      reason: r.reason,
    }));
  }

  /** Accept a suggestion → creates a pinned manual link on the product side. */
  async accept(organizationId: string, productId: string, candidateProductId: string, relationType: string): Promise<void> {
    if (!['related', 'accessory', 'cross_sell', 'up_sell'].includes(relationType)) {
      throw new RecommendationValidationError(`relationType must be one of related, accessory, cross_sell, up_sell`);
    }
    await this.catalog.createManualLink(productId, candidateProductId, relationType, { isAutomated: true });
  }

  /** Hide a suggestion on this product (pair exclusion). */
  async hide(organizationId: string, productId: string, candidateProductId: string): Promise<void> {
    await this.exclusions.create({
      organizationId,
      storeId: null,
      productId,
      excludedProductId: candidateProductId,
      scope: 'pair',
      reason: 'Merchant hid suggestion',
    });
  }

  /** Hide a product everywhere (global exclusion). */
  async hideGlobally(organizationId: string, candidateProductId: string): Promise<void> {
    await this.exclusions.create({
      organizationId,
      storeId: null,
      productId: candidateProductId,
      excludedProductId: candidateProductId,
      scope: 'global',
      reason: 'Merchant hid product globally',
    });
  }
}
