/**
 * Notification Scheduled Jobs
 *
 * Delivery-log cleanup, queued notification sending, and email digests.
 * Also wires the notification/email job creators so libs/jobs can
 * delegate to this module's infrastructure without importing it.
 * Collected by boot/scheduledJobs.ts at app boot.
 */

import { query } from '../../libs/db';
import { eventBus } from '../../libs/events/eventBus';
import { logger } from '../../libs/logger';
import {
  HOURS,
  MINUTES,
  ScheduledJobDefinition,
  setNotificationCreator,
  setEmailCreator,
} from '../../libs/jobs/cronScheduler';
import type { EmailJobData, NotificationJobData } from '../../libs/jobs/cronScheduler';
import { NotificationRepo } from './infrastructure/repositories/notificationRepo';

/**
 * Wire notification/email creators so JobScheduler can delegate to
 * module infrastructure without libs/ importing from modules/.
 */
export function wireNotificationJobCreators(): void {
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
}

export const scheduledJobs: ScheduledJobDefinition[] = [
  {
    // Cleanup old job history every day
    id: 'cleanup-job-history',
    name: 'Cleanup Job History',
    handler: async () => {
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
    intervalMs: 24 * HOURS,
  },
  {
    // Send queued notifications every 2 minutes
    id: 'notification-sender',
    name: 'Notification Sender',
    handler: async () => {
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
    intervalMs: 2 * MINUTES,
  },
  {
    // Send email digests daily at 8 AM (runs every 24 hours)
    id: 'email-digest',
    name: 'Email Digest',
    handler: async () => {
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
    intervalMs: 24 * HOURS,
  },
];
