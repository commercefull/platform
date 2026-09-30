/**
 * GetRecommendationStats tests — passthrough to the candidate repo.
 */

import { lazyMock, ORG_ID } from '../../tests/testUtils';
import { GetRecommendationStatsUseCase } from './GetRecommendationStats';
import type { CandidateRepository } from '../../domain/repositories/CandidateRepository';

describe('GetRecommendationStatsUseCase', () => {
  it('should return repo stats for the scope', async () => {
    const candidates = lazyMock<CandidateRepository>();
    candidates.getStats.mockResolvedValue({ productsWithFbt: 12, lastRebuiltAt: new Date('2026-09-26T00:00:00Z'), ordersCounted: 340 });
    const useCase = new GetRecommendationStatsUseCase(candidates);

    const res = await useCase.execute({ organizationId: ORG_ID, storeId: null });

    expect(candidates.getStats).toHaveBeenCalledWith({ organizationId: ORG_ID, storeId: null });
    expect(res.productsWithFbt).toBe(12);
    expect(res.ordersCounted).toBe(340);
  });
});
