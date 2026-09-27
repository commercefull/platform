/**
 * ListProductSuggestions tests — suggestion filtering (linked, excluded),
 * accept → pinned manual link, hide → exclusion.
 */

import { lazyMock, ORG_ID, createCard, createCandidate, createManualLink } from '../../tests/testUtils';
import { ListProductSuggestionsUseCase } from './ListProductSuggestions';
import type { CandidateRepository } from '../../domain/repositories/CandidateRepository';
import type { ExclusionRepository } from '../../domain/repositories/RuleRepository';
import type { CatalogPort } from '../ports/CatalogPort';
import type { RecommendationExclusionProps } from '../../domain/entities/RecommendationExclusion';
import { RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

function exclusion(overrides: Partial<RecommendationExclusionProps> = {}): RecommendationExclusionProps {
  return {
    recommendationExclusionId: 'ex-1',
    organizationId: ORG_ID,
    storeId: null,
    productId: 'src-1',
    excludedProductId: 'cand-1',
    scope: 'pair',
    reason: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('ListProductSuggestionsUseCase', () => {
  let candidates: jest.Mocked<CandidateRepository>;
  let exclusions: jest.Mocked<ExclusionRepository>;
  let catalog: jest.Mocked<CatalogPort>;
  let useCase: ListProductSuggestionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    candidates = lazyMock<CandidateRepository>();
    exclusions = lazyMock<ExclusionRepository>();
    catalog = lazyMock<CatalogPort>();
    candidates.listSuggestions.mockResolvedValue([]);
    exclusions.listForProducts.mockResolvedValue([]);
    catalog.getManualLinks.mockResolvedValue([]);
    catalog.getCards.mockResolvedValue([]);
    useCase = new ListProductSuggestionsUseCase(candidates, exclusions, catalog);
  });

  it('should return candidates with card data', async () => {
    candidates.listSuggestions.mockResolvedValue([
      createCandidate({ candidateProductId: 's1', source: 'fbt', score: 0.8 }),
      createCandidate({ candidateProductId: 's2', source: 'similar', score: 0.6 }),
    ]);
    catalog.getCards.mockResolvedValue([
      createCard({ productId: 's1', name: 'Memory Card' }),
      createCard({ productId: 's2', name: 'Tripod' }),
    ]);

    const res = await useCase.list(ORG_ID, 'src-1');

    expect(res).toHaveLength(2);
    expect(res[0]).toMatchObject({ candidateProductId: 's1', name: 'Memory Card', source: 'fbt' });
  });

  it('should hide candidates already linked manually', async () => {
    candidates.listSuggestions.mockResolvedValue([
      createCandidate({ candidateProductId: 'linked' }),
      createCandidate({ candidateProductId: 'fresh' }),
    ]);
    catalog.getManualLinks.mockResolvedValue([createManualLink({ relatedProductId: 'linked' })]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'fresh' })]);

    const res = await useCase.list(ORG_ID, 'src-1');

    expect(res.map(r => r.candidateProductId)).toEqual(['fresh']);
  });

  it('should hide pair-excluded and globally-excluded candidates', async () => {
    candidates.listSuggestions.mockResolvedValue([
      createCandidate({ candidateProductId: 'pair-hidden' }),
      createCandidate({ candidateProductId: 'global-hidden' }),
      createCandidate({ candidateProductId: 'fresh' }),
    ]);
    exclusions.listForProducts.mockResolvedValue([
      exclusion({ excludedProductId: 'pair-hidden', scope: 'pair' }),
      exclusion({ excludedProductId: 'global-hidden', scope: 'global' }),
    ]);
    catalog.getCards.mockResolvedValue([createCard({ productId: 'fresh' })]);

    const res = await useCase.list(ORG_ID, 'src-1');

    expect(res.map(r => r.candidateProductId)).toEqual(['fresh']);
  });

  it('should create an automated manual link when accepting a suggestion', async () => {
    await useCase.accept(ORG_ID, 'src-1', 'cand-9', 'cross_sell');

    expect(catalog.createManualLink).toHaveBeenCalledWith('src-1', 'cand-9', 'cross_sell', { isAutomated: true });
  });

  it('should reject accept with an invalid relation type', async () => {
    await expect(useCase.accept(ORG_ID, 'src-1', 'cand-9', 'grouped')).rejects.toThrow(RecommendationValidationError);
    expect(catalog.createManualLink).not.toHaveBeenCalled();
  });

  it('should create a pair exclusion when hiding a suggestion', async () => {
    await useCase.hide(ORG_ID, 'src-1', 'cand-9');

    expect(exclusions.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID, productId: 'src-1', excludedProductId: 'cand-9', scope: 'pair' }),
    );
  });

  it('should create a global exclusion when hiding a product everywhere', async () => {
    await useCase.hideGlobally(ORG_ID, 'cand-9');

    expect(exclusions.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID, excludedProductId: 'cand-9', scope: 'global' }),
    );
  });
});
