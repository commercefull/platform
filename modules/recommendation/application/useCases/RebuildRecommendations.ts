/**
 * Rebuild Recommendations Use Case
 * Spec §6.3 — nightly per-tenant rebuild of the serving read models.
 * Every step is idempotent; each `replaceForSource` writes fresh rows then
 * deletes stale ones for an atomic-per-source swap.
 */

import type { CoPurchaseRepository } from '../../domain/repositories/CoPurchaseRepository';
import type { CandidateRepository, PopularRow } from '../../domain/repositories/CandidateRepository';
import type { RuleRepository } from '../../domain/repositories/RuleRepository';
import type { CatalogPort, CatalogFeatureRow } from '../ports/CatalogPort';
import type { RecommendationConfigPort } from '../ports/RecommendationConfigPort';
import { rankCoPurchases, decayFactor } from '../../domain/services/CoOccurrenceScorer';
import { rankSimilarProducts } from '../../domain/services/SimilarityScorer';
import type { RecommendationCandidateInsert } from '../../domain/entities/RecommendationCandidate';
import { logger } from '../../../../libs/logger';

export class RebuildRecommendationsCommand {
  constructor(
    public readonly organizationId: string,
    public readonly storeId?: string | null,
  ) {}
}

export class RebuildRecommendationsUseCase {
  constructor(
    private readonly signals: CoPurchaseRepository,
    private readonly candidates: CandidateRepository,
    private readonly rules: RuleRepository,
    private readonly catalog: CatalogPort,
    private readonly config: RecommendationConfigPort,
  ) {}

  async execute(command: RebuildRecommendationsCommand): Promise<{ candidatesWritten: number }> {
    const scope = { organizationId: command.organizationId, storeId: command.storeId ?? null };
    const cfg = await this.config.getConfig(command.organizationId, command.storeId ?? undefined);
    const runStartedAt = new Date();
    let written = 0;

    // 1. Decay raw counters, prune rows below the floor
    await this.signals.applyDecay(scope, decayFactor(cfg.decayHalfLifeDays), 0.5);

    // 2. FBT candidates from co-purchase pairs
    const [pairs, counts, totalOrders] = await Promise.all([
      this.signals.listAllPairs(scope),
      this.signals.listAllProductCounts(scope),
      this.signals.getTotalOrders(scope),
    ]);
    const byProduct = new Map<string, typeof pairs>();
    for (const p of pairs) {
      const arr = byProduct.get(p.productId) || [];
      arr.push(p);
      byProduct.set(p.productId, arr);
    }
    const fbtRows: RecommendationCandidateInsert[] = [];
    for (const [productId, productPairs] of byProduct) {
      const scored = rankCoPurchases(
        productPairs,
        id => counts.get(id) ?? 0,
        totalOrders,
        { minSupport: cfg.fbtMinSupport, minLift: cfg.fbtMinLift },
        cfg.candidatesTopN,
      );
      for (const s of scored) {
        fbtRows.push({
          ...scope,
          productId,
          candidateProductId: s.relatedProductId,
          source: 'fbt',
          relationType: 'cross_sell',
          score: s.confidence,
          reason: { support: Math.round(s.support), confidence: Number(s.confidence.toFixed(3)), lift: Number(s.lift.toFixed(2)) },
          computedAt: runStartedAt,
        });
      }
    }
    await this.candidates.replaceForSource(scope, 'fbt', fbtRows, runStartedAt);
    written += fbtRows.length;

    // 3. Load catalog features once — feeds similar + rules + popular-by-category
    const features = await this.loadAllFeatures(command.organizationId);
    const eligible = features.filter(f => f.status === 'active');
    const featureById = new Map(eligible.map(f => [f.productId, f]));

    // 4. Similar candidates (same primary-category bucket or same brand)
    const similarRows: RecommendationCandidateInsert[] = [];
    for (const f of eligible) {
      const ranked = rankSimilarProducts(
        this.toSimilarityFeatures(f),
        eligible.map(e => this.toSimilarityFeatures(e)),
        cfg.similarMinScore,
        cfg.candidatesTopN,
      );
      for (const s of ranked) {
        similarRows.push({
          ...scope,
          productId: f.productId,
          candidateProductId: s.productId,
          source: 'similar',
          relationType: 'related',
          score: s.score,
          reason: { similarityScore: s.score },
          computedAt: runStartedAt,
        });
      }
    }
    await this.candidates.replaceForSource(scope, 'similar', similarRows, runStartedAt);
    written += similarRows.length;

    // 5. Resolve active rules against the feature snapshot
    const ruleRows = await this.resolveRules(scope, eligible, featureById, counts, runStartedAt);
    await this.candidates.replaceForSource(scope, 'rule', ruleRows, runStartedAt);
    written += ruleRows.length;

    // 6. Popular lists (overall + per primary category)
    await this.rebuildPopular(scope, eligible, counts);

    await this.candidates.setLastRebuiltAt(scope, runStartedAt);
    logger.info('Recommendation rebuild complete', { organizationId: command.organizationId, candidatesWritten: written });
    return { candidatesWritten: written };
  }

  /** Drop serving rows for a deleted/unpublished/archived product. */
  async removeProduct(organizationId: string, productId: string): Promise<void> {
    await this.candidates.deleteForProduct(organizationId, productId);
  }

  private async loadAllFeatures(organizationId: string): Promise<CatalogFeatureRow[]> {
    const out: CatalogFeatureRow[] = [];
    let cursor: string | null = null;
    do {
      const page = await this.catalog.listFeatures(organizationId, cursor, 500);
      out.push(...page.features);
      cursor = page.nextCursor;
    } while (cursor);
    return out;
  }

  private toSimilarityFeatures(f: CatalogFeatureRow) {
    return {
      productId: f.productId,
      primaryCategoryId: f.primaryCategoryId,
      secondaryCategoryIds: f.secondaryCategoryIds,
      collectionIds: f.collectionIds,
      brandId: f.brandId,
      attributeValues: f.attributeValues,
      basePriceCents: f.basePriceCents,
    };
  }

  private async resolveRules(
    scope: { organizationId: string; storeId: string | null },
    eligible: CatalogFeatureRow[],
    featureById: Map<string, CatalogFeatureRow>,
    counts: Map<string, number>,
    runStartedAt: Date,
  ): Promise<RecommendationCandidateInsert[]> {
    const rows: RecommendationCandidateInsert[] = [];
    const activeRules = await this.rules.listActive(scope.organizationId);

    const sourceMatches = (f: CatalogFeatureRow, type: string, id: string): boolean => {
      switch (type) {
        case 'category':
          return f.primaryCategoryId === id || f.secondaryCategoryIds.includes(id);
        case 'brand':
          return f.brandId === id;
        case 'collection':
          return f.collectionIds.includes(id);
        case 'productType':
          return f.type === id;
        default:
          return false;
      }
    };

    for (const rule of activeRules) {
      const sources = eligible.filter(f => sourceMatches(f, rule.sourceType, rule.sourceId));
      if (sources.length === 0) continue;
      const targets = eligible
        .filter(f => sourceMatches(f, rule.targetType, rule.targetId))
        .sort((a, b) => {
          if (rule.targetSort === 'newest') return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
          if (rule.targetSort === 'rating') return (b.averageRating ?? 0) - (a.averageRating ?? 0);
          return (counts.get(b.productId) ?? 0) - (counts.get(a.productId) ?? 0);
        })
        .slice(0, rule.maxItems);

      for (const source of sources) {
        const priced = this.applyPriceBand(source, targets, rule.priceBand, featureById);
        for (const target of priced) {
          if (target.productId === source.productId) continue;
          rows.push({
            ...scope,
            productId: source.productId,
            candidateProductId: target.productId,
            source: 'rule',
            relationType: (rule.relationType as RecommendationCandidateInsert['relationType']) || 'related',
            score: 1 + rule.priority / 1000, // rules rank by priority, manual still wins at blend time
            reason: { ruleId: rule.recommendationRuleId, ruleName: rule.name },
            computedAt: runStartedAt,
          });
        }
      }
    }
    return rows;
  }

  private applyPriceBand(
    source: CatalogFeatureRow,
    targets: CatalogFeatureRow[],
    band: string,
    _featureById: Map<string, CatalogFeatureRow>,
  ): CatalogFeatureRow[] {
    if (band === 'any' || source.basePriceCents === null) return targets;
    return targets.filter(t => {
      if (t.basePriceCents === null) return false;
      if (band === 'cheaper') return t.basePriceCents < source.basePriceCents!;
      if (band === 'pricier') return t.basePriceCents > source.basePriceCents!;
      const pct = 0.25 * source.basePriceCents!;
      return Math.abs(t.basePriceCents - source.basePriceCents!) <= pct;
    });
  }

  private async rebuildPopular(
    scope: { organizationId: string; storeId: string | null },
    eligible: CatalogFeatureRow[],
    counts: Map<string, number>,
  ): Promise<void> {
    const scored = eligible
      .map(f => ({ productId: f.productId, score: counts.get(f.productId) ?? 0, categoryId: f.primaryCategoryId }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score || a.productId.localeCompare(b.productId));

    const overall: PopularRow[] = scored.slice(0, 50).map((s, i) => ({
      scope: 'overall',
      categoryId: null,
      productId: s.productId,
      rank: i + 1,
      score: s.score,
    }));
    await this.candidates.replacePopular(scope, 'overall', null, overall);

    const byCategory = new Map<string, typeof scored>();
    for (const s of scored) {
      if (!s.categoryId) continue;
      const arr = byCategory.get(s.categoryId) || [];
      arr.push(s);
      byCategory.set(s.categoryId, arr);
    }
    for (const [categoryId, list] of byCategory) {
      const rows: PopularRow[] = list.slice(0, 20).map((s, i) => ({
        scope: 'category',
        categoryId,
        productId: s.productId,
        rank: i + 1,
        score: s.score,
      }));
      await this.candidates.replacePopular(scope, 'category', categoryId, rows);
    }
  }
}
