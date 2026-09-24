/**
 * Basket Scheduled Jobs
 *
 * Cart abandonment detection and recovery reminders.
 * Collected by boot/scheduledJobs.ts at app boot.
 */

import { query } from '../../libs/db';
import { eventBus } from '../../libs/events/eventBus';
import { logger } from '../../libs/logger';
import { HOURS, ScheduledJobDefinition } from '../../libs/jobs/cronScheduler';

export const scheduledJobs: ScheduledJobDefinition[] = [
  {
    // Cart abandonment reminders every hour
    id: 'cart-abandonment',
    name: 'Cart Abandonment Reminders',
    handler: async () => {
      try {
        const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const abandonedBaskets = await query<Array<{ basketId: string; customerId: string; sessionId: string }>>(
          `SELECT b."basketId", b."customerId", b."sessionId"
           FROM basket b
           WHERE b.status = 'active'
             AND b."lastActivityAt" < $1
             AND EXISTS (SELECT 1 FROM "basketItem" bi WHERE bi."basketId" = b."basketId")`,
          [cutoff],
        );

        for (const basket of abandonedBaskets || []) {
          eventBus.emit('basket.abandoned', {
            basketId: basket.basketId,
            customerId: basket.customerId,
            sessionId: basket.sessionId,
          });

          if (!basket.customerId) {
            await query(`UPDATE basket SET status = 'abandoned', "updatedAt" = now() WHERE "basketId" = $1`, [basket.basketId]);
          }
        }

        logger.info(`[cron] cart-abandonment: found ${abandonedBaskets?.length || 0} abandoned baskets`);
      } catch (err: unknown) {
        logger.error('cart-abandonment error', { error: (err as Error).message });
      }
    },
    intervalMs: 1 * HOURS,
  },
];
