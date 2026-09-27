/**
 * StorefrontRecommendationAdapter — ACL translating product's
 * StorefrontRecommendationPort onto the recommendation module's public
 * serving use case. Returns empty results when the recommendation module
 * is disabled, so the PDP falls back to manual links + category heuristics.
 * Only this file may import from recommendation.
 */

import { moduleRegistry } from '../../../../libs/moduleRegistry';
import { logger } from '../../../../libs/logger';
import { getRecommendationsUseCase } from '../../../recommendation/application/useCases/wired';
import { GetRecommendationsCommand } from '../../../recommendation/application/useCases/GetRecommendations';
import type {
  StorefrontRecommendationContext,
  StorefrontRecommendationItem,
  StorefrontRecommendationPort,
} from '../../application/ports/StorefrontRecommendationPort';

export class StorefrontRecommendationAdapter implements StorefrontRecommendationPort {
  async getForPlacement(
    placement: string,
    productIds: string[],
    context: StorefrontRecommendationContext,
    limit?: number,
  ): Promise<StorefrontRecommendationItem[]> {
    if (!moduleRegistry.isEnabled('recommendation')) return [];
    try {
      const result = await getRecommendationsUseCase.execute(new GetRecommendationsCommand(placement, productIds, context, limit));
      return result.items.map(item => ({
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        primaryImageUrl: item.imageUrl,
        basePriceCents: item.basePriceCents,
        salePriceCents: item.salePriceCents,
        effectivePriceCents: item.effectivePriceCents,
        isOnSale: item.isOnSale,
        currency: item.currency,
        source: item.source,
      }));
    } catch (err) {
      logger.debug('Storefront recommendation lookup failed, using fallback', { placement, error: err });
      return [];
    }
  }
}
