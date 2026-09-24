/**
 * Payment Event Handlers
 *
 * Keeps order payment status in sync and notifies customers on
 * payment completion, failure, and refunds.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query } from '../../../libs/db';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';
import type { OrderRepository } from '../../order/domain/repositories/OrderRepository';

export interface PaymentEventHandlerDeps {
  orders: Pick<OrderRepository, 'findById'>;
}

export function registerPaymentEventHandlers(deps: PaymentEventHandlerDeps): void {
  const { orders } = deps;

  // Payment completed -> update order status, notify customer
  eventBus.registerHandler('payment.completed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const transactionId = data.transactionId as string;
    const amount = data.amount as number;
    if (!orderId) return;

    try {
      // Update order payment status
      await query('UPDATE "order" SET "paymentStatus" = \'paid\', "updatedAt" = now() WHERE "orderId" = $1', [orderId]);

      // Notify customer
      const order = await orders.findById(orderId);
      if (order?.customerId) {
        await JobScheduler.scheduleNotification({
          userId: order.customerId,
          type: 'payment_completed',
          title: 'Payment Received',
          message: `Your payment of $${(amount || 0).toFixed(2)} for order ${order.orderNumber} has been received.`,
          data: { orderId, orderNumber: order.orderNumber, transactionId, amount },
        });
      }

      logger.info(`payment.completed: order ${orderId} payment status updated to paid`);
    } catch (err: unknown) {
      logger.error(`payment.completed handler error: ${(err as Error).message}`);
    }
  });

  // Payment failed -> notify customer, emit order.payment_failed
  eventBus.registerHandler('payment.failed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const reason = data.reason as string;
    if (!orderId) return;

    try {
      const order = await orders.findById(orderId);
      if (!order) return;

      // Notify customer about payment failure
      if (order.customerId) {
        await JobScheduler.scheduleNotification({
          userId: order.customerId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment for order ${order.orderNumber} failed${reason ? `: ${reason}` : ''}. Please try again.`,
          data: { orderId, orderNumber: order.orderNumber, reason },
          channels: ['email', 'push', 'in_app'],
        });
      }

      // Emit order.payment_failed so inventory reservations get released
      eventBus.emit('order.payment_failed', { orderId });

      logger.info(`payment.failed: order ${orderId} payment failed${reason ? ` (${reason})` : ''}`);
    } catch (err: unknown) {
      logger.error(`payment.failed handler error: ${(err as Error).message}`);
    }
  });

  // Payment refunded -> notify customer
  eventBus.registerHandler('payment.refunded', async payload => {
    const data = payload.data as Record<string, unknown>;
    const transactionId = data.transactionId as string;
    const amount = data.amount as number;
    if (!transactionId) return;

    try {
      // Find the order from the transaction
      const orderResult = await query<Array<{ orderId: string }>>('SELECT "orderId" FROM "paymentTransaction" WHERE "transactionId" = $1', [
        transactionId,
      ]);
      const orderId = orderResult?.[0]?.orderId;
      if (!orderId) return;

      const order = await orders.findById(orderId);
      if (order?.customerId) {
        await JobScheduler.scheduleNotification({
          userId: order.customerId,
          type: 'payment_refunded',
          title: 'Refund Processed',
          message: `A refund of $${(amount || 0).toFixed(2)} for order ${order.orderNumber} has been processed.`,
          data: { orderId, orderNumber: order.orderNumber, transactionId, amount },
          channels: ['email', 'in_app'],
        });
      }

      logger.info(`payment.refunded: refund of $${amount} for transaction ${transactionId}`);
    } catch (err: unknown) {
      logger.error(`payment.refunded handler error: ${(err as Error).message}`);
    }
  });
}
