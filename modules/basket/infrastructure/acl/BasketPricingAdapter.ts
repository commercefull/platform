/**
 * BasketPricingAdapter
 *
 * ACL adapter implementing basket's ProductPricePort.
 * Translates the pricing module's calculatePrice result into basket's
 * ResolvedProductPrice — integer cents across the boundary.
 *
 * Only this adapter may import from pricing's public API.
 */

import { pricingService } from '../../../pricing/application/wired';
import { logger } from '../../../../libs/logger';
import type { ProductPricePort, ResolvedProductPrice } from '../../application/ports/ProductPricePort';

export class BasketPricingAdapter implements ProductPricePort {
  async getPrice(
    productId: string,
    productVariantId?: string,
    currencyCode?: string,
    quantity?: number,
  ): Promise<ResolvedProductPrice | null> {
    try {
      const result = await pricingService.calculatePrice(productId, {
        variantId: productVariantId,
        currencyCode,
        quantity,
      });
      return { unitPriceCents: result.finalPriceCents, currency: result.currency };
    } catch (error) {
      // A missing base price means the product is not purchasable — treat as null
      logger.debug('Price resolution failed', { productId, productVariantId, error: (error as Error).message });
      return null;
    }
  }
}
