/**
 * Compute Recommendations Use Case
 * Generates recommendations based on purchase and view data
 */

import * as recommendationRepo from '../../../repos/recommendationRepo';

export interface ComputeRecommendationsInput {
  type?: 'frequently_bought_together' | 'customers_also_viewed' | 'all';
  minPurchaseCount?: number;
  minViewCount?: number;
}

export interface ComputeRecommendationsOutput {
  computed: number;
}

export async function computeRecommendations(input: ComputeRecommendationsInput = {}): Promise<ComputeRecommendationsOutput> {
  const type = input.type || 'all';
  let totalComputed = 0;

  if (type === 'frequently_bought_together' || type === 'all') {
    const count = await recommendationRepo.computeFrequentlyBoughtTogether(
      input.minPurchaseCount || 2
    );
    totalComputed += count;
  }

  if (type === 'customers_also_viewed' || type === 'all') {
    const count = await recommendationRepo.computeCustomersAlsoViewed(
      input.minViewCount || 3
    );
    totalComputed += count;
  }

  return { computed: totalComputed };
}
