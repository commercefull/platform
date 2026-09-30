/**
 * Get Recommendation Stats Use Case — merchant stats card (spec §8.3):
 * coverage, last rebuild, orders counted.
 */

import type { CandidateRepository } from '../../domain/repositories/CandidateRepository';
import type { SignalScope } from '../../domain/repositories/CoPurchaseRepository';

export class GetRecommendationStatsUseCase {
  constructor(private readonly candidates: CandidateRepository) {}

  async execute(scope: SignalScope): Promise<{ productsWithFbt: number; lastRebuiltAt: Date | null; ordersCounted: number }> {
    return this.candidates.getStats(scope);
  }
}
