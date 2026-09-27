/**
 * Get Recommendations Use Case
 * Spec §7 — placement serving: waterfall blending over manual links,
 * rule/fbt/similar/coView candidates and popular fallback; dedupe,
 * multi-source score aggregation, batched eligibility, limit.
 * Results are cached briefly (keyed on tenant + placement + product ids).
 */

import { createCache } from '../../../../libs/cache';
import type { CandidateRepository } from '../../domain/repositories/CandidateRepository';
import type { ExclusionRepository } from '../../domain/repositories/RuleRepository';
import type { CatalogPort, RecommendationCard } from '../ports/CatalogPort';
import type { RecommendationConfigPort } from '../ports/RecommendationConfigPort';
import { PLACEMENTS, isPlacementId, type PlacementId } from '../../domain/valueObjects/Placement';
import { blend, applyEligibility, type BlendCandidate } from '../../domain/services/RecommendationBlender';
import type { CandidateReason } from '../../domain/entities/RecommendationCandidate';
import { RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

export interface RecommendationContext {
  organizationId?: string;
  storeId?: string;
  currencyCode?: string;
  /** Explicit category for popular-in-category when no source product is given. */
  categoryId?: string;
}

export class GetRecommendationsCommand {
  constructor(
    public readonly placement: string,
    public readonly productIds: string[],
    public readonly context: RecommendationContext,
    public readonly limit?: number,
  ) {}
}

export interface RecommendationItem {
  productId: string;
  name: string;
  slug: string;
  imageUrl?: string;
  effectivePriceCents: number;
  basePriceCents: number;
  salePriceCents: number | null;
  isOnSale: boolean;
  currency?: string;
  source: string;
  reason: CandidateReason | undefined;
}

export interface GetRecommendationsResponse {
  placement: string;
  productIds: string[];
  items: RecommendationItem[];
}

const responseCache = createCache<GetRecommendationsResponse>({ namespace: 'recommendation', ttlMs: 15 * 60 * 1000 });

export class GetRecommendationsUseCase {
  constructor(
    private readonly candidates: CandidateRepository,
    private readonly exclusions: ExclusionRepository,
    private readonly catalog: CatalogPort,
    private readonly config: RecommendationConfigPort,
  ) {}

  async execute(command: GetRecommendationsCommand): Promise<GetRecommendationsResponse> {
    if (!isPlacementId(command.placement)) {
      throw new RecommendationValidationError(`Unknown placement: ${command.placement}`);
    }
    const productIds = [...new Set(command.productIds.filter(Boolean))];
    const plan = PLACEMENTS[command.placement];
    const limit = command.limit ?? plan.limit;
    const scope = {
      organizationId: command.context.organizationId ?? '',
      storeId: command.context.storeId ?? null,
    };

    const cacheKey = `${scope.organizationId}:${scope.storeId ?? ''}:${command.placement}:${[...productIds].sort().join(',')}:${limit}`;
    return responseCache.getOrSet(cacheKey, async () => {
      const cfg = await this.config.getConfig(scope.organizationId, scope.storeId ?? undefined);

      // Resolve each waterfall step into ranked BlendCandidates
      const steps: Array<{ source: (typeof plan.sources)[number]; candidates: BlendCandidate[] }> = [];
      for (const source of plan.sources) {
        if (source === 'manual') {
          const links = await this.catalog.getManualLinks(productIds, plan.relationTypes);
          steps.push({
            source,
            candidates: links.map(l => ({
              productId: l.relatedProductId,
              source: 'manual',
              candidateSource: 'manual',
              score: 1000 - l.position, // curated order wins
              relationType: l.type,
            })),
          });
        } else if (source === 'popular') {
          // Headless callers may lack an organization — scoped stores can't
          // resolve; return an empty step rather than a uuid cast error.
          if (!scope.organizationId) {
            steps.push({ source, candidates: [] });
            continue;
          }
          const categoryId =
            command.context.categoryId ??
            (plan.popularScope === 'category' && productIds[0] ? await this.catalog.getPrimaryCategory(productIds[0]) : null);
          const popularScope = categoryId ? 'category' : plan.popularScope;
          const popular = await this.candidates.listPopular(scope, popularScope, categoryId, limit);
          steps.push({
            source,
            candidates: popular.map(p => ({ productId: p.productId, source, candidateSource: 'fbt', score: 50 - p.rank })),
          });
        } else {
          const rows = scope.organizationId ? await this.candidates.listForProducts(scope, productIds, { source, limit: limit * 2 }) : [];
          steps.push({
            source,
            candidates: rows.map(r => ({
              productId: r.candidateProductId,
              source,
              candidateSource: r.source,
              score: r.score,
              relationType: r.relationType,
              reason: r.reason ?? undefined,
            })),
          });
        }
      }

      // Over-fetch for eligibility filtering
      const picked = blend({ sourceProductIds: productIds, steps }, limit * 2);
      if (picked.length === 0) {
        return { placement: command.placement, productIds, items: [] };
      }

      const cards = await this.catalog.getCards(
        picked.map(p => p.productId),
        { ...command.context },
      );
      const exclusionRows = scope.organizationId ? await this.exclusions.listForProducts(scope, productIds) : [];
      const picked2 = applyEligibility(
        picked,
        cards,
        {
          excludeProductIds: new Set(productIds),
          excludedPairs: new Set(exclusionRows.filter(e => e.scope === 'pair').map(e => `${e.productId}:${e.excludedProductId}`)),
          globalExclusions: new Set(exclusionRows.filter(e => e.scope === 'global').map(e => e.excludedProductId)),
          hideOutOfStock: cfg.hideOutOfStock,
        },
        productIds[0],
      );

      return {
        placement: command.placement as PlacementId,
        productIds,
        items: picked2.slice(0, limit).map(p => this.toItem(p.card, p)),
      };
    });
  }

  private toItem(card: RecommendationCard, p: BlendCandidate): RecommendationItem {
    return {
      productId: card.productId,
      name: card.name,
      slug: card.slug,
      imageUrl: card.primaryImageUrl,
      effectivePriceCents: card.effectivePriceCents,
      basePriceCents: card.basePriceCents,
      salePriceCents: card.salePriceCents,
      isOnSale: card.isOnSale,
      currency: card.currency,
      source: p.candidateSource,
      reason: p.reason,
    };
  }
}
