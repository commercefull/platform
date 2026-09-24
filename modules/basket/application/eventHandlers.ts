/**
 * Basket Event Handlers
 *
 * Sends cart recovery notifications when a basket is abandoned.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';

export function registerBasketEventHandlers(): void {
  // Basket abandoned -> send cart recovery notification
  eventBus.registerHandler('basket.abandoned', async payload => {
    const data = payload.data as Record<string, unknown>;
    const basketId = data.basketId as string;
    const customerId = data.customerId as string;
    const totalValue = data.totalValue as number;
    const itemCount = data.itemCount as number;
    if (!basketId || !customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'cart_abandoned',
        title: 'You left items in your cart',
        message: `You have ${itemCount || 0} item(s) waiting in your cart${totalValue ? ` ($${totalValue.toFixed(2)})` : ''}. Come back and complete your purchase!`,
        data: { basketId, totalValue, itemCount },
        channels: ['email', 'push', 'in_app'],
      });
      logger.info(`basket.abandoned: sent recovery notification to customer ${customerId} for basket ${basketId}`);
    } catch (err: unknown) {
      logger.error(`basket.abandoned handler error: ${(err as Error).message}`);
    }
  });
}
