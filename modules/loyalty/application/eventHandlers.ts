/**
 * Loyalty Event Handlers
 *
 * Awards points on completed orders and notifies customers of
 * points/tier changes.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';
import type { OrderRepository } from '../../order/domain/repositories/OrderRepository';
import type { LoyaltyRepository } from '../domain/repositories/LoyaltyRepository';

export interface LoyaltyEventHandlerDeps {
  orders: Pick<OrderRepository, 'findById'>;
  points: Pick<LoyaltyRepository, 'processOrderPoints'>;
}

export function registerLoyaltyEventHandlers(deps: LoyaltyEventHandlerDeps): void {
  const { orders, points } = deps;

  // Order completed -> award loyalty points based on order total
  eventBus.registerHandler('order.completed', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    const customerId = eventData.customerId as string;
    if (!orderId || !customerId) return;

    try {
      const order = await orders.findById(orderId);
      if (!order) return;

      const orderTotal = order.totalAmount?.amount ?? 0;
      if (orderTotal > 0) {
        await points.processOrderPoints(customerId, orderId, orderTotal);
        logger.info(`order.completed: awarded loyalty points for order ${orderId} to customer ${customerId}`);
      }
    } catch (err: unknown) {
      logger.error(`order.completed loyalty handler error: ${(err as Error).message}`);
    }
  });

  // Points earned -> notify customer
  eventBus.registerHandler('loyalty.points_earned', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const pointsEarned = data.points as number;
    if (!customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'loyalty_points_earned',
        title: 'Points Earned!',
        message: `You earned ${pointsEarned} loyalty points!`,
        data: { customerId, points: pointsEarned },
      });
      logger.info(`loyalty.points_earned: ${pointsEarned} points for customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`loyalty.points_earned handler error: ${(err as Error).message}`);
    }
  });

  // Points redeemed -> notify customer
  eventBus.registerHandler('loyalty.points_redeemed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const pointsRedeemed = data.points as number;
    if (!customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'loyalty_points_redeemed',
        title: 'Points Redeemed',
        message: `You redeemed ${pointsRedeemed} loyalty points.`,
        data: { customerId, points: pointsRedeemed },
      });
      logger.info(`loyalty.points_redeemed: ${pointsRedeemed} points by customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`loyalty.points_redeemed handler error: ${(err as Error).message}`);
    }
  });

  // Tier upgraded -> notify customer with benefits
  eventBus.registerHandler('loyalty.tier_upgraded', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const newTier = data.newTier as string;
    if (!customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'loyalty_tier_upgraded',
        title: 'Tier Upgraded!',
        message: `Congratulations! You've been upgraded to ${newTier} tier.`,
        data: { customerId, newTier },
        channels: ['email', 'push', 'in_app'],
      });
      logger.info(`loyalty.tier_upgraded: customer ${customerId} upgraded to ${newTier}`);
    } catch (err: unknown) {
      logger.error(`loyalty.tier_upgraded handler error: ${(err as Error).message}`);
    }
  });
}
