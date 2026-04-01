/**
 * GetProductRecommendations Use Case
 *
 * Queries marketingProductRecommendation for a customer/product context.
 *
 * Validates: Requirements 6.6
 */

import * as productRecommendationRepo from '../../infrastructure/repositories/productRecommendationRepo';
import type { MarketingProductRecommendation } from '../../infrastructure/repositories/productRecommendationRepo';

// ============================================================================
// Command
// ============================================================================

export class GetProductRecommendationsCommand {
  constructor(
    public readonly customerId: string,
    public readonly type: string = 'similar',
    public readonly limit: number = 10,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface GetProductRecommendationsResponse {
  customerId: string;
  type: string;
  recommendations: Array<{
    marketingProductRecommendationId: string;
    productId: string;
    recommendedProductId: string;
    score: number;
  }>;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetProductRecommendationsUseCase {
  constructor(private readonly recommendationRepo: typeof productRecommendationRepo = productRecommendationRepo) {}

  async execute(command: GetProductRecommendationsCommand): Promise<GetProductRecommendationsResponse> {
    if (!command.customerId) throw new Error('customerId is required');

    const recommendations = await this.recommendationRepo.findForCustomer(
      command.customerId,
      command.type,
      command.limit,
    );

    return {
      customerId: command.customerId,
      type: command.type,
      recommendations: recommendations.map((r: MarketingProductRecommendation) => ({
        marketingProductRecommendationId: r.marketingProductRecommendationId,
        productId: r.productId,
        recommendedProductId: r.recommendedProductId,
        score: r.score,
      })),
    };
  }
}
