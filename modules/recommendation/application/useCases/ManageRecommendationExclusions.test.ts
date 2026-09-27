/**
 * ManageRecommendationExclusions tests — pair/global scope rules and
 * tenant-scoped delete.
 */

import { lazyMock, ORG_ID } from '../../tests/testUtils';
import { ManageRecommendationExclusionsUseCase } from './ManageRecommendationExclusions';
import type { ExclusionRepository } from '../../domain/repositories/RuleRepository';
import type { RecommendationExclusionProps } from '../../domain/entities/RecommendationExclusion';
import { RecommendationExclusionNotFoundError, RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

function exclusion(overrides: Partial<RecommendationExclusionProps> = {}): RecommendationExclusionProps {
  return {
    recommendationExclusionId: 'ex-1',
    organizationId: ORG_ID,
    storeId: null,
    productId: 'p1',
    excludedProductId: 'p2',
    scope: 'pair',
    reason: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('ManageRecommendationExclusionsUseCase', () => {
  let exclusions: jest.Mocked<ExclusionRepository>;
  let useCase: ManageRecommendationExclusionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    exclusions = lazyMock<ExclusionRepository>();
    useCase = new ManageRecommendationExclusionsUseCase(exclusions);
  });

  it('should create a pair exclusion', async () => {
    exclusions.create.mockResolvedValue(exclusion());

    await useCase.create(ORG_ID, { productId: 'p1', excludedProductId: 'p2' });

    expect(exclusions.create).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1', excludedProductId: 'p2', scope: 'pair' }));
  });

  it('should require productId for pair exclusions', async () => {
    await expect(useCase.create(ORG_ID, { excludedProductId: 'p2' })).rejects.toThrow(RecommendationValidationError);
    expect(exclusions.create).not.toHaveBeenCalled();
  });

  it('should create a global exclusion without a source product', async () => {
    exclusions.create.mockResolvedValue(exclusion({ scope: 'global' }));

    await useCase.create(ORG_ID, { excludedProductId: 'p2', scope: 'global' });

    expect(exclusions.create).toHaveBeenCalledWith(expect.objectContaining({ scope: 'global', excludedProductId: 'p2' }));
  });

  it('should require excludedProductId', async () => {
    await expect(useCase.create(ORG_ID, { productId: 'p1' })).rejects.toThrow(RecommendationValidationError);
  });

  it('should delete an exclusion owned by the organization', async () => {
    exclusions.list.mockResolvedValue([exclusion()]);

    await useCase.delete(ORG_ID, 'ex-1');

    expect(exclusions.delete).toHaveBeenCalledWith('ex-1');
  });

  it('should reject deleting an exclusion from another organization', async () => {
    exclusions.list.mockResolvedValue([exclusion({ recommendationExclusionId: 'other-ex' })]);

    await expect(useCase.delete(ORG_ID, 'ex-1')).rejects.toThrow(RecommendationExclusionNotFoundError);
    expect(exclusions.delete).not.toHaveBeenCalled();
  });
});
