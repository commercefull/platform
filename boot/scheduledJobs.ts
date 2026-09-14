/**
 * Scheduled Jobs Initialization
 *
 * Registers all cron jobs and wires job creators (notification, email, report)
 * into the JobScheduler at application boot. This keeps libs/jobs free of module imports.
 */

import { cronScheduler, setNotificationCreator, setEmailCreator, setReportCreator } from '../libs/jobs/cronScheduler';
import type { EmailJobData, ReportJobData, NotificationJobData } from '../libs/jobs/cronScheduler';
import { query } from '../libs/db';
import { eventBus } from '../libs/events/eventBus';
import { logger } from '../libs/logger';
import { NotificationRepo } from '../modules/notification/infrastructure/repositories/notificationRepo';
import { releaseExpired } from '../modules/inventory/infrastructure/repositories/inventoryReservationRepo';
import { generateReport } from '../modules/reporting/infrastructure/repositories/reportDataProvider';
import {
  listActiveSchedules,
  markScheduleRun,
  createExecution,
  updateExecution,
  computeNextRunDate,
} from '../modules/reporting/infrastructure/repositories/reportingRepo';

// Time intervals in milliseconds
const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;

/**
 * Wire job creators so JobScheduler can delegate to module infrastructure
 * without libs/ importing from modules/.
 */
function wireJobCreators(): void {
  setNotificationCreator(async (data: NotificationJobData) => {
    const repo = new NotificationRepo();
    const channels = data.channels || ['in_app'];
    for (const channel of channels) {
      await repo.create({
        userId: data.userId,
        userType: 'customer',
        type: data.type,
        title: data.title,
        content: data.message,
        channel,
        isRead: false,
        priority: 'normal',
        metadata: data.data || {},
      });
    }
  });

  setEmailCreator(async (data: EmailJobData) => {
    const repo = new NotificationRepo();
    await repo.create({
      userId: data.to,
      userType: 'customer',
      type: data.template,
      title: data.subject,
      content: JSON.stringify(data.data),
      channel: 'email',
      isRead: false,
      priority: data.priority || 'normal',
      metadata: { recipient: data.to, template: data.template, ...data.data },
    });
  });

  setReportCreator(async (data: ReportJobData) => {
    const result = await generateReport(data.reportType as never, {
      dateFrom: data.dateRange.start,
      dateTo: data.dateRange.end,
      ...data.filters,
    });
    logger.info(`[JobScheduler.scheduleReport] generated ${data.reportType} report for ${data.recipientEmail}`);
    const repo = new NotificationRepo();
    await repo.create({
      userId: data.recipientEmail,
      userType: 'organization',
      type: 'report_ready',
      title: `Report Ready: ${data.reportType}`,
      content: `Your ${data.reportType} report has been generated.`,
      channel: 'email',
      isRead: false,
      priority: 'normal',
      metadata: { reportType: data.reportType, summary: result.summary, recipientEmail: data.recipientEmail },
    });
  });
}

/**
 * Initialize all scheduled jobs.
 * Call this from app.ts or main entry point.
 */
export const initializeScheduledJobs = (): void => {
  // Wire job creators first so JobScheduler can delegate to module infrastructure
  wireJobCreators();

  // Cleanup expired reservations every 5 minutes
  cronScheduler.registerJob(
    'cleanup-expired-reservations',
    'Cleanup Expired Reservations',
    async () => {
      const count = await releaseExpired();
      if (count > 0) {
        logger.info('Released expired inventory reservations', { count });
      }
    },
    5 * MINUTES,
  );

  // Sync inventory every 6 hours
  cronScheduler.registerJob(
    'inventory-sync',
    'Inventory Sync',
    async () => {
      try {
        const result = await query<Array<{ productId: string; totalQuantity: string; totalReserved: string }>>(
          `SELECT "productId",
             COALESCE(SUM(quantity), 0) as "totalQuantity",
             COALESCE(SUM(reserved), 0) as "totalReserved"
           FROM "inventoryLevel"
           GROUP BY "productId"`,
        );

        const products = result || [];
        let synced = 0;
        for (const p of products) {
          const available = parseInt(p.totalQuantity, 10) - parseInt(p.totalReserved, 10);
          await query(`UPDATE "inventoryItem" SET "availableQuantity" = $1, "updatedAt" = now() WHERE "productId" = $2`, [
            available,
            p.productId,
          ]);
          synced++;
        }
        logger.info(`[cron] inventory-sync: synced ${synced} products`);
      } catch (err: unknown) {
        logger.error('inventory-sync error', { error: (err as Error).message });
      }
    },
    6 * HOURS,
  );

  // Check low stock items every hour
  cronScheduler.registerJob(
    'low-stock-check',
    'Low Stock Check',
    async () => {
      try {
        const lowStockItems = await query<
          Array<{ productId: string; sku: string; availableQuantity: string; reservedQuantity: string; minStockLevel: string }>
        >(
          `SELECT il."productId", p.sku, il."availableQuantity", il."reservedQuantity", il."minStockLevel"
           FROM "inventoryLevel" il
           LEFT JOIN product p ON il."productId" = p."productId"
           WHERE (il."availableQuantity" - il."reservedQuantity") > 0
             AND (il."availableQuantity" - il."reservedQuantity") <= COALESCE(il."minStockLevel", 0)`,
        );

        for (const item of lowStockItems || []) {
          const currentStock = parseInt(item.availableQuantity, 10) - parseInt(item.reservedQuantity, 10);
          const reorderPoint = parseInt(item.minStockLevel, 10);
          eventBus.emit('inventory.low', {
            productId: item.productId,
            sku: item.sku,
            currentStock,
            reorderPoint,
          });
        }

        const outOfStockItems = await query<Array<{ productId: string; sku: string }>>(
          `SELECT il."productId", p.sku
           FROM "inventoryLevel" il
           LEFT JOIN product p ON il."productId" = p."productId"
           WHERE (il."availableQuantity" - il."reservedQuantity") <= 0`,
        );

        for (const item of outOfStockItems || []) {
          eventBus.emit('inventory.out_of_stock', {
            productId: item.productId,
            sku: item.sku,
          });
        }

        logger.info(`[cron] low-stock-check: ${lowStockItems?.length || 0} low stock, ${outOfStockItems?.length || 0} out of stock`);
      } catch (err: unknown) {
        logger.error('low-stock-check error', { error: (err as Error).message });
      }
    },
    1 * HOURS,
  );

  // Cleanup old sessions every 30 minutes
  cronScheduler.registerJob(
    'session-cleanup',
    'Session Cleanup',
    async () => {
      try {
        const result = await query<{ rowCount: number }>(`DELETE FROM "identityUserSession" WHERE "expiresAt" < now()`);
        const count = result?.rowCount || 0;

        try {
          await query(`DELETE FROM session WHERE expire < now()`);
        } catch {
          // Table may not exist in all deployments
        }

        if (count > 0) {
          logger.info(`[cron] session-cleanup: removed ${count} expired sessions`);
        }
      } catch (err: unknown) {
        logger.error('session-cleanup error', { error: (err as Error).message });
      }
    },
    30 * MINUTES,
  );

  // Daily sales report at midnight (runs every 24 hours)
  cronScheduler.registerJob(
    'daily-sales-report',
    'Daily Sales Report',
    async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await query<Array<{ totalOrders: string; totalRevenue: string; avgOrderValue: string }>>(
          `SELECT
             COUNT(*) as "totalOrders",
             COALESCE(SUM("totalAmount"), 0) as "totalRevenue",
             COALESCE(AVG("totalAmount"), 0) as "avgOrderValue"
           FROM "order"
           WHERE "createdAt" >= $1
             AND "createdAt" < $2
             AND status NOT IN ('cancelled', 'failed')`,
          [yesterday, today],
        );

        const data = stats?.[0];
        if (data) {
          logger.info(
            `[cron] daily-sales-report: ${data.totalOrders} orders, $${data.totalRevenue} revenue, $${data.avgOrderValue} avg for ${yesterday.toDateString()}`,
          );
        }
      } catch (err: unknown) {
        logger.error('daily-sales-report error', { error: (err as Error).message });
      }
    },
    24 * HOURS,
  );

  // Cleanup old job history every day
  cronScheduler.registerJob(
    'cleanup-job-history',
    'Cleanup Job History',
    async () => {
      try {
        const deliveryResult = await query<{ rowCount: number }>(
          `DELETE FROM "notificationDeliveryLog" WHERE "createdAt" < now() - interval '90 days'`,
        );

        const eventResult = await query<{ rowCount: number }>(
          `DELETE FROM "notificationEventLog" WHERE "createdAt" < now() - interval '90 days'`,
        );

        const analyticsResult = await query<{ rowCount: number }>(
          `DELETE FROM "analyticsReportEvent" WHERE "createdAt" < now() - interval '365 days'`,
        );

        const total = (deliveryResult?.rowCount || 0) + (eventResult?.rowCount || 0) + (analyticsResult?.rowCount || 0);
        if (total > 0) {
          logger.info(`[cron] cleanup-job-history: removed ${total} old records`);
        }
      } catch (err: unknown) {
        logger.error('cleanup-job-history error', { error: (err as Error).message });
      }
    },
    24 * HOURS,
  );

  // Cart abandonment reminders every hour
  cronScheduler.registerJob(
    'cart-abandonment',
    'Cart Abandonment Reminders',
    async () => {
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
    1 * HOURS,
  );

  // Send queued notifications every 2 minutes
  cronScheduler.registerJob(
    'notification-sender',
    'Notification Sender',
    async () => {
      try {
        const repo = new NotificationRepo();

        const unsent = await repo.findUnsent(50);
        if (unsent.length === 0) return;

        let sent = 0;
        for (const notification of unsent) {
          try {
            await repo.markAsSent(notification.notificationId);
            sent++;
          } catch {
            // Individual notification failures don't stop the batch
          }
        }

        if (sent > 0) {
          logger.info(`[cron] notification-sender: sent ${sent} notifications`);
        }
      } catch (err: unknown) {
        logger.error(`[cron] notification-sender error: ${(err as Error).message}`);
      }
    },
    2 * MINUTES,
  );

  // Generate scheduled reports every 15 minutes
  cronScheduler.registerJob(
    'report-generator',
    'Report Generator',
    async () => {
      try {
        const schedules = await listActiveSchedules();
        const now = new Date();
        const due = schedules.filter(s => !s.nextRunAt || s.nextRunAt <= now);

        if (due.length === 0) return;

        let generated = 0;
        for (const schedule of due) {
          const execution = await createExecution(schedule.reportScheduleId);
          try {
            const result = await generateReport(schedule.reportType, schedule.parameters || {});
            await updateExecution(execution.reportExecutionId, {
              status: 'completed',
              completedAt: new Date(),
              metadata: result.summary as Record<string, unknown> | undefined,
            });
            const nextRun = computeNextRunDate(schedule.frequency, now);
            await markScheduleRun(schedule.reportScheduleId, nextRun);
            generated++;
          } catch (err: unknown) {
            await updateExecution(execution.reportExecutionId, {
              status: 'failed',
              completedAt: new Date(),
              errorMessage: (err as Error).message,
            });
          }
        }

        if (generated > 0) {
          logger.info(`[cron] report-generator: generated ${generated} reports`);
        }
      } catch (err: unknown) {
        logger.error(`[cron] report-generator error: ${(err as Error).message}`);
      }
    },
    15 * MINUTES,
  );

  // Send email digests daily at 8 AM (runs every 24 hours)
  cronScheduler.registerJob(
    'email-digest',
    'Email Digest',
    async () => {
      try {
        const recentUnread = await query<Array<{ userId: string; userType: string; count: string }>>(
          `SELECT "userId", "userType", COUNT(*) as count
           FROM notification
           WHERE "isRead" = false
             AND "sentAt" IS NULL
             AND "createdAt" >= now() - interval '24 hours'
           GROUP BY "userId", "userType"
           ORDER BY count DESC
           LIMIT 100`,
        );

        if (!recentUnread || recentUnread.length === 0) return;

        let sent = 0;
        for (const entry of recentUnread) {
          try {
            const userRow = await query<Array<{ email: string }>>(
              `SELECT email FROM customer WHERE "customerId" = $1
            UNION ALL
            SELECT email FROM "organization" WHERE "organizationId" = $1`,
              [entry.userId],
            );
            const email = userRow?.[0]?.email;
            if (!email) continue;

            eventBus.emit('notification.digest', {
              userId: entry.userId,
              email,
              unreadCount: parseInt(entry.count, 10),
            });
            sent++;
          } catch {
            // Individual failures don't stop the batch
          }
        }

        if (sent > 0) {
          logger.info(`[cron] email-digest: sent ${sent} digest emails`);
        }
      } catch (err: unknown) {
        logger.error(`[cron] email-digest error: ${(err as Error).message}`);
      }
    },
    24 * HOURS,
  );
};
