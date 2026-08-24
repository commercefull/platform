/**
 * Checkout Event Handlers
 *
 * Subscribes to payment-related events published by the payment module
 * and updates checkout session state accordingly.
 *
 * This replaces the previous synchronous ACL calls
 * (markCheckoutPaymentAuthorized / markCheckoutPaymentFailed) with
 * Published Language event subscriptions, decoupling the payment module
 * from checkout's infrastructure.
 */

import { eventBus, EventPayload } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import type { CheckoutRepository } from '../domain/repositories/CheckoutRepository';

/**
 * Register checkout event handlers for payment lifecycle events.
 * Called from registerEventHandlers.ts on app boot.
 */
export function registerCheckoutEventHandlers(repo: CheckoutRepository): void {
  // checkout.payment_captured → mark checkout session as payment authorized
  eventBus.registerHandler('checkout.payment_captured', async (payload: EventPayload) => {
    const { checkoutId } = payload.data as { checkoutId?: string };
    if (!checkoutId) return;

    try {
      const session = await repo.findById(checkoutId);
      if (!session) {
        logger.warn('checkout.payment_captured: session not found', { checkoutId });
        return;
      }

      session.markPaymentAuthorized();
      await repo.save(session);
      logger.debug('Checkout session marked as payment authorized', { checkoutId });
    } catch (err: unknown) {
      logger.error('Failed to mark checkout as payment authorized', {
        checkoutId,
        error: (err as Error).message,
      });
      throw err;
    }
  });

  // checkout.failed → mark checkout session as payment failed
  eventBus.registerHandler('checkout.failed', async (payload: EventPayload) => {
    const { checkoutId } = payload.data as { checkoutId?: string };
    if (!checkoutId) return;

    try {
      const session = await repo.findById(checkoutId);
      if (!session) {
        logger.warn('checkout.failed: session not found', { checkoutId });
        return;
      }

      session.markPaymentFailed();
      await repo.save(session);
      logger.debug('Checkout session marked as payment failed', { checkoutId });
    } catch (err: unknown) {
      logger.error('Failed to mark checkout as payment failed', {
        checkoutId,
        error: (err as Error).message,
      });
      throw err;
    }
  });
}
