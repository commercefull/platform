/**
 * GetRecommendations tests — placement waterfall, dedupe, exclusions,
 * eligibility, popular fallback.
 */

import { lazyMock, ORG_ID, createCard, createCandidate, createManualLink } from '../../tests/testUtils';
import { GetRecommendationsUseCase, GetRecommendationsCommand } from './GetRecommendations';
import type { CandidateRepository } from '../../domain/repositories/CandidateRepository';
import type { ExclusionRepository } from '../../domain/repositories/RuleRepository';
import type { CatalogPort } from '../ports/CatalogPort';
import type { RecommendationConfigPort } from '../ports/RecommendationConfigPort';
import { DEFAULT_RECOMMENDATION_CONFIG } from '../ports/RecommendationConfigPort';
import { RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

const SCOPE = { organizationId: ORG_ID, storeId: null };

function exclusionRow(overrides: Partial<{ productId: string; excludedProductId: string; scope: 'pair' | 'global' }> = {}) {
  return {
    recommendationExclusionId: 'ex-1',
    organizationId: ORG_ID,
    storeId: null,
    productId: 'src-1',
    excludedProductId: 'cand-1',
    scope: 'pair' as const,
    reason: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('GetRecommendationsUseCase', () => {
  let candidates: jest.Mocked<CandidateRepository>;
  let exclusions: jest.Mocked<ExclusionRepository>;
  let catalog: jest.Mocked<CatalogPort>;
  let config: jest.Mocked<RecommendationConfigPort>;
  let useCase: GetRecommendationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    candidates = lazyMock<CandidateRepository>();
    exclusions = lazyMock<ExclusionRepository>();
    catalog = lazyMock<CatalogPort>();
    config = lazyMock<RecommendationConfigPort>();
    config.getConfig.mockResolvedValue({ ...DEFAULT_RECOMMENDATION_CONFIG });
    catalog.getManualLinks.mockResolvedValue([]);
    catalog.getCards.mockResolvedValue([]);
    catalog.getPrimaryCategory.mockResolvedValue(null);
    candidates.listForProducts.mockResolvedValue([]);
    candidates.listPopular.mockResolvedValue([]);
    exclusions.listForProducts.mockResolvedValue([]);
    useCase = new GetRecommendationsUseCase(candidates, exclusions, catalog, config);
  });

  const run = (placement: string, productIds = ['src-1'], limit?: number) =>
    useCase.execute(new GetRecommendationsCommand(placement, productIds, { organizationId: ORG_ID }, limit));

  it('should reject an unknown placement', async () => {
    await expect(run('bogus')).rejects.toThrow(RecommendationValidationError);
  });

  it('should return manual links first when they exist', async () => {
    catalog.getManualLinks.mockResolvedValue([
      createManualLink({ relatedProductId: 'm1', position: 0 }),
      createManualLink({ relatedProductId: 'm2', position: 1 }),
    ]);
    candidates.listForProducts.mockResolvedValue([createCandidate({ candidateProductId: 'f1', source: 'similar', score: 0.9 })]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'm1' }), createCard({ productId: 'm2' }), createCard({ productId: 'f1' })]);

    const res = await run('pdpAlsoLike');

    expect(res.items.map(i => i.productId)).toEqual(['m1', 'm2', 'f1']);
    expect(res.items[0].source).toBe('manual');
  });

  it('should exclude the source product and dedupe across sources', async () => {
    catalog.getManualLinks.mockResolvedValue([createManualLink({ relatedProductId: 'src-1' })]);
    candidates.listForProducts.mockResolvedValue([
      createCandidate({ candidateProductId: 'x', source: 'similar' }),
      createCandidate({ candidateProductId: 'x', source: 'coView', score: 0.5 }),
    ]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'src-1' }), createCard({ productId: 'x' })]);

    const res = await run('pdpAlsoLike');

    expect(res.items.map(i => i.productId)).toEqual(['x']);
  });

  it('should drop pair and global exclusions', async () => {
    candidates.listForProducts.mockResolvedValue([
      createCandidate({ candidateProductId: 'banned-pair', source: 'similar' }),
      createCandidate({ candidateProductId: 'banned-global', source: 'similar' }),
      createCandidate({ candidateProductId: 'ok', source: 'similar' }),
    ]);
    exclusions.listForProducts.mockResolvedValue([
      exclusionRow({ productId: 'src-1', excludedProductId: 'banned-pair', scope: 'pair' }),
      exclusionRow({ excludedProductId: 'banned-global', scope: 'global' }),
    ]);
    catalog.getCards.mockResolvedValue([
      createCard({ productId: 'banned-pair' }),
      createCard({ productId: 'banned-global' }),
      createCard({ productId: 'ok' }),
    ]);

    const res = await run('pdpAlsoLike');

    expect(res.items.map(i => i.productId)).toEqual(['ok']);
  });

  it('should drop candidates without an eligible card', async () => {
    candidates.listForProducts.mockResolvedValue([
      createCandidate({ candidateProductId: 'gone', source: 'similar' }),
      createCandidate({ candidateProductId: 'drafted', source: 'similar' }),
      createCandidate({ candidateProductId: 'ok', source: 'similar' }),
    ]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'drafted', status: 'draft' }), createCard({ productId: 'ok' })]);

    const res = await run('pdpAlsoLike');

    expect(res.items.map(i => i.productId)).toEqual(['ok']);
  });

  it('should use category-scoped popular when the plan is category and a source product exists', async () => {
    catalog.getPrimaryCategory.mockResolvedValue('cat-9');
    candidates.listPopular.mockResolvedValue([{ scope: 'category', categoryId: 'cat-9', productId: 'pop-1', rank: 1, score: 42 }]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'pop-1' })]);

    const res = await run('pdpAlsoLike');

    expect(candidates.listPopular).toHaveBeenCalledWith(SCOPE, 'category', 'cat-9', expect.any(Number));
    expect(res.items.map(i => i.productId)).toEqual(['pop-1']);
  });

  it('should serve overall popular for the emptyState placement', async () => {
    candidates.listPopular.mockResolvedValue([{ scope: 'overall', categoryId: null, productId: 'pop-1', rank: 1, score: 42 }]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'pop-1' })]);

    const res = await run('emptyState', []);

    expect(candidates.listPopular).toHaveBeenCalledWith(SCOPE, 'overall', null, expect.any(Number));
    expect(res.items.map(i => i.productId)).toEqual(['pop-1']);
  });

  it('should respect the requested limit', async () => {
    catalog.getManualLinks.mockResolvedValue([
      createManualLink({ relatedProductId: 'm1', position: 0 }),
      createManualLink({ relatedProductId: 'm2', position: 1 }),
      createManualLink({ relatedProductId: 'm3', position: 2 }),
    ]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'm1' }), createCard({ productId: 'm2' }), createCard({ productId: 'm3' })]);

    const res = await run('pdpAlsoLike', ['src-1'], 2);

    expect(res.items).toHaveLength(2);
  });

  it('should return an empty list when nothing resolves', async () => {
    const res = await run('pdpAlsoLike');
    expect(res.items).toEqual([]);
    expect(res.placement).toBe('pdpAlsoLike');
  });
});
