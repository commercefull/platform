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
import { JobScheduler } from '../../../libs/jobs/cronScheduler';
import { UpdateOrderStatusUseCase, UpdateOrderStatusCommand } from '../application/useCases/UpdateOrderStatus';
import { OrderStatus } from '../domain/valueObjects/OrderStatus';
import type { OrderRepository } from '../domain/repositories/OrderRepository';

/**
 * Register order event handlers for payment lifecycle events.
 * Called from registerEventHandlers.ts on app boot.
 */
export function registerOrderPaymentEventHandlers(orders: OrderRepository): void {
  // order.payment_failed → update order status to PAYMENT_FAILED
  eventBus.registerHandler('order.payment_failed', async (payload: EventPayload) => {
    const { orderId } = payload.data as { orderId?: string };
    if (!orderId) return;

    try {
      const updateOrderStatus = new UpdateOrderStatusUseCase(orders);
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

/**
 * Register order lifecycle event handlers.
 * Called from boot/registerEventHandlers.ts on app boot.
 */
export function registerOrderEventHandlers(orders: OrderRepository): void {
  // Order completed -> send delivery confirmation notification
  eventBus.registerHandler('order.completed', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    const customerId = eventData.customerId as string;
    if (!orderId || !customerId) return;

    try {
      const order = await orders.findById(orderId);
      if (!order) return;

      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'order_completed',
        title: 'Order Delivered',
        message: `Your order ${order.orderNumber} has been delivered successfully.`,
        data: { orderId, orderNumber: order.orderNumber },
      });
    } catch (err: unknown) {
      logger.error(`order.completed handler error: ${(err as Error).message}`);
    }
  });
}
