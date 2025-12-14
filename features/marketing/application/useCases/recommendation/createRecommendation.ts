/**
 * Create Manual Recommendation Use Case
 */

import * as recommendationRepo from '../../../repos/recommendationRepo';
import { RecommendationType } from './getRecommendations';

export interface CreateRecommendationInput {
  productId: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  score?: number;
  rank?: number;
}

export interface CreateRecommendationOutput {
  recommendation: recommendationRepo.ProductRecommendation;
}

export async function createRecommendation(input: CreateRecommendationInput): Promise<CreateRecommendationOutput> {
  // Validate required fields
  if (!input.productId) {
    throw new Error('Product ID is required');
  }
  if (!input.recommendedProductId) {
    throw new Error('Recommended product ID is required');
  }
  if (!input.recommendationType) {
    throw new Error('Recommendation type is required');
  }

  // Cannot recommend a product to itself
  if (input.productId === input.recommendedProductId) {
    throw new Error('Cannot recommend a product to itself');
  }

  const recommendation = await recommendationRepo.saveRecommendation({
    productId: input.productId,
    recommendedProductId: input.recommendedProductId,
    recommendationType: input.recommendationType,
    score: input.score || 1,
    rank: input.rank,
    isManual: true,
    isActive: true
  });

  return { recommendation };
}
