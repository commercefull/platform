/**
 * Get Product Recommendations Use Case
 */

import * as recommendationRepo from '../../../repos/recommendationRepo';

export type RecommendationType = 
  | 'frequently_bought_together' 
  | 'similar_products' 
  | 'customers_also_viewed'
  | 'customers_also_bought'
  | 'trending' 
  | 'personalized' 
  | 'manual'
  | 'cross_sell'
  | 'upsell';

export interface GetRecommendationsInput {
  productId: string;
  type?: RecommendationType;
  limit?: number;
}

export interface GetRecommendationsOutput {
  recommendations: recommendationRepo.ProductRecommendation[];
}

export async function getRecommendations(input: GetRecommendationsInput): Promise<GetRecommendationsOutput> {
  if (!input.productId) {
    throw new Error('Product ID is required');
  }

  const recommendations = await recommendationRepo.getRecommendationsForProduct(
    input.productId,
    input.type,
    input.limit || 10
  );

  return { recommendations };
}

export async function getFrequentlyBoughtTogether(productId: string, limit?: number): Promise<GetRecommendationsOutput> {
  const recommendations = await recommendationRepo.getFrequentlyBoughtTogether(productId, limit || 5);
  return { recommendations };
}

export async function getSimilarProducts(productId: string, limit?: number): Promise<GetRecommendationsOutput> {
  const recommendations = await recommendationRepo.getSimilarProducts(productId, limit || 10);
  return { recommendations };
}

export async function getCrossSellProducts(productId: string, limit?: number): Promise<GetRecommendationsOutput> {
  const recommendations = await recommendationRepo.getCrossSellProducts(productId, limit || 5);
  return { recommendations };
}

export async function getUpsellProducts(productId: string, limit?: number): Promise<GetRecommendationsOutput> {
  const recommendations = await recommendationRepo.getUpsellProducts(productId, limit || 5);
  return { recommendations };
}
