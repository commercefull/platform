/**
 * RebuildRecommendations tests — decay, fbt candidate scoring, similar
 * candidates, rule resolution, popular lists, product removal.
 */

import { lazyMock, ORG_ID, createFeature } from '../../tests/testUtils';
import { RebuildRecommendationsUseCase, RebuildRecommendationsCommand } from './RebuildRecommendations';
import type { CoPurchaseRepository } from '../../domain/repositories/CoPurchaseRepository';
import type { CandidateRepository } from '../../domain/repositories/CandidateRepository';
import type { RuleRepository } from '../../domain/repositories/RuleRepository';
import type { CatalogPort } from '../ports/CatalogPort';
import type { RecommendationConfigPort } from '../ports/RecommendationConfigPort';
import { DEFAULT_RECOMMENDATION_CONFIG } from '../ports/RecommendationConfigPort';
import type { RecommendationRuleProps } from '../../domain/entities/RecommendationRule';
import type { RecommendationCandidateInsert } from '../../domain/entities/RecommendationCandidate';

function rule(overrides: Partial<RecommendationRuleProps> = {}): RecommendationRuleProps {
  return {
    recommendationRuleId: 'rule-1',
    organizationId: ORG_ID,
    storeId: null,
    name: 'Test rule',
    sourceType: 'category',
    sourceId: 'cat-src',
    targetType: 'category',
    targetId: 'cat-target',
    relationType: 'accessory',
    targetSort: 'bestSelling',
    priceBand: 'any',
    maxItems: 4,
    priority: 0,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

const fbtRows = (source: string) =>
  (jest.mocked(candidatesRef.replaceForSource).mock.calls.find(c => c[1] === source)?.[2] ?? []) as RecommendationCandidateInsert[];

// hoisted reference so the helper above can read the mock inside tests
let candidatesRef: jest.Mocked<CandidateRepository>;

describe('RebuildRecommendationsUseCase', () => {
  let signals: jest.Mocked<CoPurchaseRepository>;
  let candidates: jest.Mocked<CandidateRepository>;
  let rules: jest.Mocked<RuleRepository>;
  let catalog: jest.Mocked<CatalogPort>;
  let config: jest.Mocked<RecommendationConfigPort>;
  let useCase: RebuildRecommendationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    signals = lazyMock<CoPurchaseRepository>();
    candidates = lazyMock<CandidateRepository>();
    candidatesRef = candidates;
    rules = lazyMock<RuleRepository>();
    catalog = lazyMock<CatalogPort>();
    config = lazyMock<RecommendationConfigPort>();
    config.getConfig.mockResolvedValue({ ...DEFAULT_RECOMMENDATION_CONFIG });
    signals.listAllPairs.mockResolvedValue([]);
    signals.listAllProductCounts.mockResolvedValue(new Map());
    signals.getTotalOrders.mockResolvedValue(0);
    catalog.listFeatures.mockResolvedValue({ features: [], nextCursor: null });
    rules.listActive.mockResolvedValue([]);
    useCase = new RebuildRecommendationsUseCase(signals, candidates, rules, catalog, config);
  });

  const run = () => useCase.execute(new RebuildRecommendationsCommand(ORG_ID));

  it('should decay counters before scoring', async () => {
    await run();
    expect(signals.applyDecay).toHaveBeenCalledWith(
      { organizationId: ORG_ID, storeId: null },
      expect.closeTo(0.9923, 3), // 90-day half-life
      0.5,
    );
  });

  it('should write fbt candidates for pairs passing support and lift', async () => {
    // a→b: confidence 10/10 = 1, expected 10/20 = 0.5, lift 2
    signals.listAllPairs.mockResolvedValue([{ productId: 'a', relatedProductId: 'b', coCount: 10 }]);
    signals.listAllProductCounts.mockResolvedValue(
      new Map([
        ['a', 10],
        ['b', 10],
      ]),
    );
    signals.getTotalOrders.mockResolvedValue(20);

    const res = await run();

    const written = fbtRows('fbt');
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ productId: 'a', candidateProductId: 'b', source: 'fbt', relationType: 'cross_sell' });
    expect(written[0].reason).toMatchObject({ support: 10, confidence: 1 });
    expect(res.candidatesWritten).toBe(1);
  });

  it('should skip pairs below the support threshold', async () => {
    signals.listAllPairs.mockResolvedValue([{ productId: 'a', relatedProductId: 'b', coCount: 1 }]);
    signals.listAllProductCounts.mockResolvedValue(
      new Map([
        ['a', 10],
        ['b', 10],
      ]),
    );
    signals.getTotalOrders.mockResolvedValue(20);

    await run();
    expect(fbtRows('fbt')).toHaveLength(0);
  });

  it('should write similar candidates for products sharing a primary category', async () => {
    catalog.listFeatures.mockResolvedValue({
      features: [
        createFeature({ productId: 'a', primaryCategoryId: 'cat-1' }),
        createFeature({ productId: 'b', primaryCategoryId: 'cat-1' }),
        createFeature({ productId: 'c', primaryCategoryId: 'cat-2' }),
      ],
      nextCursor: null,
    });

    await run();

    const written = fbtRows('similar');
    expect(written.map(r => `${r.productId}->${r.candidateProductId}`).sort()).toEqual(['a->b', 'b->a']);
  });

  it('should skip inactive products when writing similar candidates', async () => {
    catalog.listFeatures.mockResolvedValue({
      features: [
        createFeature({ productId: 'a', primaryCategoryId: 'cat-1' }),
        createFeature({ productId: 'b', primaryCategoryId: 'cat-1', status: 'draft' }),
      ],
      nextCursor: null,
    });

    await run();
    expect(fbtRows('similar')).toHaveLength(0);
  });

  it('should resolve category rules sorted by best-selling order counts', async () => {
    rules.listActive.mockResolvedValue([rule()]);
    signals.listAllProductCounts.mockResolvedValue(
      new Map([
        ['t1', 5],
        ['t2', 50],
      ]),
    );
    catalog.listFeatures.mockResolvedValue({
      features: [
        createFeature({ productId: 'src-a', primaryCategoryId: 'cat-src' }),
        createFeature({ productId: 't1', primaryCategoryId: 'cat-target' }),
        createFeature({ productId: 't2', primaryCategoryId: 'cat-target' }),
      ],
      nextCursor: null,
    });

    await run();

    const written = fbtRows('rule');
    expect(written.map(r => r.candidateProductId)).toEqual(['t2', 't1']);
    expect(written[0]).toMatchObject({ productId: 'src-a', relationType: 'accessory' });
  });

  it('should rebuild overall and per-category popular lists', async () => {
    signals.listAllProductCounts.mockResolvedValue(
      new Map([
        ['a', 30],
        ['b', 20],
        ['c', 10],
      ]),
    );
    catalog.listFeatures.mockResolvedValue({
      features: [
        createFeature({ productId: 'a', primaryCategoryId: 'cat-1' }),
        createFeature({ productId: 'b', primaryCategoryId: 'cat-1' }),
        createFeature({ productId: 'c', primaryCategoryId: 'cat-2' }),
      ],
      nextCursor: null,
    });

    await run();

    const overall = candidates.replacePopular.mock.calls.find(c => c[1] === 'overall')?.[3];
    expect(overall?.map(r => r.productId)).toEqual(['a', 'b', 'c']);

    const cat1 = candidates.replacePopular.mock.calls.find(c => c[1] === 'category' && c[2] === 'cat-1')?.[3];
    expect(cat1?.map(r => r.productId)).toEqual(['a', 'b']);
  });

  it('should record the rebuild timestamp', async () => {
    await run();
    expect(candidates.setLastRebuiltAt).toHaveBeenCalledWith({ organizationId: ORG_ID, storeId: null }, expect.any(String));
  });

  it('should drop serving rows when a product is removed', async () => {
    await useCase.removeProduct(ORG_ID, 'p-gone');
    expect(candidates.deleteForProduct).toHaveBeenCalledWith(ORG_ID, 'p-gone');
  });
});
