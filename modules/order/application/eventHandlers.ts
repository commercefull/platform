/**
 * Order Event Handlers
 *
 * Subscribes to payment-related events published by the payment module
 * and updates order state accordingly.
 *
 * This replaces the previous synchronous ACL call
 * (markOrderPaymentFailed) with a Published Language event subscription,
 * decoupling the payment module from order's infrastructure.
 */

import { eventBus, EventPayload } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import orderDataRepository from '../infrastructure/repositories/OrderDataRepository';
import { UpdateOrderStatusUseCase, UpdateOrderStatusCommand } from '../application/useCases/UpdateOrderStatus';
import { OrderStatus } from '../domain/valueObjects/OrderStatus';

const OrderRepo = orderDataRepository.commands;

/**
 * Register order event handlers for payment lifecycle events.
 * Called from registerEventHandlers.ts on app boot.
 */
export function registerOrderPaymentEventHandlers(): void {
  // order.payment_failed → update order status to PAYMENT_FAILED
  eventBus.registerHandler('order.payment_failed', async (payload: EventPayload) => {
    const { orderId } = payload.data as { orderId?: string };
    if (!orderId) return;

    try {
      const updateOrderStatus = new UpdateOrderStatusUseCase(OrderRepo);
      await updateOrderStatus.execute(new UpdateOrderStatusCommand(orderId, OrderStatus.PAYMENT_FAILED));
      logger.debug('Order marked as payment failed via event', { orderId });
    } catch (err: unknown) {
      logger.error('Failed to mark order as payment failed via event', {
        orderId,
        error: (err as Error).message,
      });
      throw err;
    }
  });
}
