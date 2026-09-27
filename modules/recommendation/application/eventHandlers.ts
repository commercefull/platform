/**
 * Recommendation event handlers — spec §6.1.
 * - order.paid → count co-purchase pairs (ledger-guarded)
 * - order.cancelled / order.refunded (full) → reverse counts
 * - product.deleted / unpublished / archived → drop serving rows
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { recordOrderCoPurchaseUseCase, rebuildRecommendationsUseCase } from './useCases/wired';

export function registerRecommendationEventHandlers(): void {
  eventBus.registerHandler('order.paid', async payload => {
    const { orderId } = payload.data as { orderId?: string };
    if (!orderId) return;
    try {
      await recordOrderCoPurchaseUseCase.onOrderPaid(orderId);
    } catch (err) {
      logger.error('recommendation: onOrderPaid failed', { orderId, error: err });
    }
  });

  const onReversed = async (payload: { data: unknown }) => {
    const { orderId } = payload.data as { orderId?: string };
    if (!orderId) return;
    try {
      await recordOrderCoPurchaseUseCase.onOrderReversed(orderId);
    } catch (err) {
      logger.error('recommendation: onOrderReversed failed', { orderId, error: err });
    }
  };
  eventBus.registerHandler('order.cancelled', onReversed);
  eventBus.registerHandler('order.refunded', onReversed);

  const onProductGone = async (payload: { data: unknown }) => {
    const data = payload.data as { productId?: string; organizationId?: string };
    if (!data.productId || !data.organizationId) return;
    try {
      await rebuildRecommendationsUseCase.removeProduct(data.organizationId, data.productId);
    } catch (err) {
      logger.error('recommendation: deleteForProduct failed', { productId: data.productId, error: err });
    }
  };
  eventBus.registerHandler('product.deleted', onProductGone);
  eventBus.registerHandler('product.unpublished', onProductGone);
  eventBus.registerHandler('product.archived', onProductGone);
}
