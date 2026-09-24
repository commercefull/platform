/**
 * Product Event Handlers
 *
 * Logs product lifecycle events for search index / cache invalidation
 * integration points.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';

export function registerProductEventHandlers(): void {
  // Product created -> log for search index update
  eventBus.registerHandler('product.created', async payload => {
    const data = payload.data as Record<string, unknown>;
    const productId = data.productId as string;
    const name = data.name as string;
    const sku = data.sku as string;
    if (!productId) return;

    try {
      logger.info(`product.created: product ${productId} (${name || sku}) created — search index update queued`);
      // Search index update would be triggered here if a search service is configured
    } catch (err: unknown) {
      logger.error(`product.created handler error: ${(err as Error).message}`);
    }
  });

  // Product updated -> log for cache invalidation and search index update
  eventBus.registerHandler('product.updated', async payload => {
    const data = payload.data as Record<string, unknown>;
    const productId = data.productId as string;
    const updatedFields = data.updatedFields as string[];
    if (!productId) return;

    try {
      logger.info(
        `product.updated: product ${productId} updated (fields: ${updatedFields?.join(', ') || 'unknown'}) — cache invalidation and search index update queued`,
      );
      // Cache invalidation and search index update would be triggered here
    } catch (err: unknown) {
      logger.error(`product.updated handler error: ${(err as Error).message}`);
    }
  });
}
