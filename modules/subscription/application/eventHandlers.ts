/**
 * Subscription Event Handlers
 *
 * Notifies customers on renewal and cancellation.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';

export function registerSubscriptionEventHandlers(): void {
  // Subscription renewed -> notify customer
  eventBus.registerHandler('subscription.renewed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const subscriptionId = data.subscriptionId as string;
    const customerId = data.customerId as string;
    const amount = data.amount as number;
    if (!subscriptionId || !customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'subscription_renewed',
        title: 'Subscription Renewed',
        message: `Your subscription has been renewed${amount ? ` for $${amount.toFixed(2)}` : ''}.`,
        data: { subscriptionId, customerId, amount },
        channels: ['email', 'in_app'],
      });
      logger.info(`subscription.renewed: subscription ${subscriptionId} renewed for customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`subscription.renewed handler error: ${(err as Error).message}`);
    }
  });

  // Subscription cancelled -> notify customer
  eventBus.registerHandler('subscription.cancelled', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerSubscriptionId = data.customerSubscriptionId as string;
    const customerId = data.customerId as string;
    const reason = data.reason as string;
    if (!customerSubscriptionId || !customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: `Your subscription has been cancelled${reason ? `: ${reason}` : ''}. You will retain access until the end of your current billing period.`,
        data: { customerSubscriptionId, customerId, reason },
        channels: ['email', 'in_app'],
      });
      logger.info(`subscription.cancelled: subscription ${customerSubscriptionId} cancelled for customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`subscription.cancelled handler error: ${(err as Error).message}`);
    }
  });
}
