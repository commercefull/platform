/**
 * Delete Recommendation Use Case
 */

import * as recommendationRepo from '../../../repos/recommendationRepo';

export interface DeleteRecommendationInput {
  recommendationId: string;
}

export async function deleteRecommendation(input: DeleteRecommendationInput): Promise<void> {
  // Validate recommendation exists
  const existing = await recommendationRepo.getRecommendation(input.recommendationId);
  if (!existing) {
    throw new Error('Recommendation not found');
  }

  await recommendationRepo.deleteRecommendation(input.recommendationId);
}

export async function deactivateRecommendation(input: DeleteRecommendationInput): Promise<void> {
  const existing = await recommendationRepo.getRecommendation(input.recommendationId);
  if (!existing) {
    throw new Error('Recommendation not found');
  }

  await recommendationRepo.deactivateRecommendation(input.recommendationId);
}
