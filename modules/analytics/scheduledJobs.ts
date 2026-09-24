/**
 * Analytics Scheduled Jobs
 *
 * Daily sales aggregation report.
 * Collected by boot/scheduledJobs.ts at app boot.
 */

import { query } from '../../libs/db';
import { logger } from '../../libs/logger';
import { HOURS, ScheduledJobDefinition } from '../../libs/jobs/cronScheduler';

export const scheduledJobs: ScheduledJobDefinition[] = [
  {
    // Daily sales report at midnight (runs every 24 hours)
    id: 'daily-sales-report',
    name: 'Daily Sales Report',
    handler: async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await query<Array<{ totalOrders: string; totalRevenueCents: string; avgOrderValueCents: string }>>(
          `SELECT
             COUNT(*) as "totalOrders",
             COALESCE(SUM("totalAmountCents"), 0) as "totalRevenueCents",
             COALESCE(AVG("totalAmountCents"), 0) as "avgOrderValueCents"
           FROM "order"
           WHERE "createdAt" >= $1
             AND "createdAt" < $2
             AND status NOT IN ('cancelled', 'failed')`,
          [yesterday, today],
        );

        const data = stats?.[0];
        if (data) {
          logger.info(
            `[cron] daily-sales-report: ${data.totalOrders} orders, ${data.totalRevenueCents} cents revenue, ${data.avgOrderValueCents} cents avg for ${yesterday.toDateString()}`,
          );
        }
      } catch (err: unknown) {
        logger.error('daily-sales-report error', { error: (err as Error).message });
      }
    },
    intervalMs: 24 * HOURS,
  },
];
