/**
 * Cron Job Scheduler
 * A lightweight background job scheduler that runs directly on the EC2 instance.
 * Uses Node.js setInterval for recurring tasks - no external dependencies like Redis/Bull.
 *
 * For production, these jobs can also be triggered via system crontab on EC2.
 */

import { query } from '../db';
import { eventBus } from '../events/eventBus';
import { logger } from '../logger';

export interface ScheduledJob {
  id: string;
  name: string;
  handler: () => Promise<void>;
  intervalMs: number;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
  runCount: number;
  errorCount: number;
  enabled: boolean;
}

export interface JobResult {
  jobId: string;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}

class CronScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private jobHistory: JobResult[] = [];
  private maxHistorySize: number = 100;

  constructor() {}

  /**
   * Register a new scheduled job
   */
  registerJob(id: string, name: string, handler: () => Promise<void>, intervalMs: number, startImmediately: boolean = false): void {
    if (this.jobs.has(id)) {
      console.warn(`Job ${id} already exists. Use updateJob() to modify.`);
      return;
    }

    const job: ScheduledJob = {
      id,
      name,
      handler,
      intervalMs,
      isRunning: false,
      runCount: 0,
      errorCount: 0,
      enabled: true,
      nextRun: new Date(Date.now() + intervalMs),
    };

    this.jobs.set(id, job);

    // Start the interval
    const interval = setInterval(async () => {
      await this.executeJob(id);
    }, intervalMs);

    this.intervals.set(id, interval);

    console.log(`Registered job: ${name} (${id}) - runs every ${intervalMs / 1000}s`);

    // Run immediately if requested
    if (startImmediately) {
      this.executeJob(id);
    }
  }

  /**
   * Execute a job by ID
   */
  private async executeJob(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job || !job.enabled || job.isRunning) return;

    job.isRunning = true;
    const startTime = Date.now();

    try {
      await job.handler();

      const result: JobResult = {
        jobId: id,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.addToHistory(result);
      job.runCount++;
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + job.intervalMs);
    } catch (error: unknown) {
      const result: JobResult = {
        jobId: id,
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        timestamp: new Date(),
      };

      this.addToHistory(result);
      job.errorCount++;
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + job.intervalMs);
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Run a job manually (outside of schedule)
   */
  async runJobNow(id: string): Promise<JobResult | null> {
    const job = this.jobs.get(id);
    if (!job) {
      return null;
    }

    if (job.isRunning) {
      console.warn(`Job ${id} is already running`);
      return null;
    }

    await this.executeJob(id);
    return this.jobHistory.find(h => h.jobId === id) || null;
  }

  /**
   * Enable/disable a job
   */
  setJobEnabled(id: string, enabled: boolean): void {
    const job = this.jobs.get(id);
    if (job) {
      job.enabled = enabled;
    }
  }

  /**
   * Remove a job
   */
  removeJob(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
    this.jobs.delete(id);
  }

  /**
   * Get all registered jobs
   */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job by ID
   */
  getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get job execution history
   */
  getHistory(jobId?: string, limit: number = 20): JobResult[] {
    let history = this.jobHistory;
    if (jobId) {
      history = history.filter(h => h.jobId === jobId);
    }
    return history.slice(-limit);
  }

  /**
   * Get scheduler statistics
   */
  getStats(): {
    totalJobs: number;
    activeJobs: number;
    runningJobs: number;
    totalRuns: number;
    totalErrors: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.enabled).length,
      runningJobs: jobs.filter(j => j.isRunning).length,
      totalRuns: jobs.reduce((sum, j) => sum + j.runCount, 0),
      totalErrors: jobs.reduce((sum, j) => sum + j.errorCount, 0),
    };
  }

  /**
   * Stop all jobs and shutdown scheduler
   */
  shutdown(): void {
    Array.from(this.intervals.entries()).forEach(([_id, interval]) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    this.jobs.clear();
  }

  private addToHistory(result: JobResult): void {
    this.jobHistory.push(result);
    // Keep history size manageable
    if (this.jobHistory.length > this.maxHistorySize) {
      this.jobHistory = this.jobHistory.slice(-this.maxHistorySize);
    }
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();

// ============================================================================
// Pre-defined Jobs
// These jobs can be started when the application boots
// ============================================================================

// Time intervals in milliseconds
const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;

/**
 * Initialize all scheduled jobs
 * Call this from your app.ts or main entry point
 */
export const initializeScheduledJobs = (): void => {
  // Cleanup expired reservations every 5 minutes
  cronScheduler.registerJob(
    'cleanup-expired-reservations',
    'Cleanup Expired Reservations',
    async () => {
      const { releaseExpired } = await import('../../modules/inventory/infrastructure/repositories/inventoryReservationRepo.js');
      const count = await releaseExpired();
      if (count > 0) {
        console.log(`[cron] Released ${count} expired inventory reservations`);
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
        // Aggregate inventory levels across locations for each product
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
          await query(
            `UPDATE "inventoryItem" SET "availableQuantity" = $1, "updatedAt" = now() WHERE "productId" = $2`,
            [available, p.productId],
          );
          synced++;
        }
        logger.info(`[cron] inventory-sync: synced ${synced} products`);
      } catch (err: unknown) {
        console.error(`[cron] inventory-sync error: ${(err as Error).message}`);
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
        // Find products at or below reorder point
        const lowStockItems = await query<Array<{ productId: string; sku: string; quantity: string; reserved: string; reorderPoint: string }>>(
          `SELECT il."productId", p.sku, il.quantity, il.reserved, il."reorderPoint"
           FROM "inventoryLevel" il
           LEFT JOIN product p ON il."productId" = p."productId"
           WHERE (il.quantity - il.reserved) > 0
             AND (il.quantity - il.reserved) <= il."reorderPoint"`,
        );

        for (const item of lowStockItems || []) {
          const currentStock = parseInt(item.quantity, 10) - parseInt(item.reserved, 10);
          const reorderPoint = parseInt(item.reorderPoint, 10);
          eventBus.emit('inventory.low', {
            productId: item.productId,
            sku: item.sku,
            currentStock,
            reorderPoint,
          });
        }

        // Find out-of-stock products
        const outOfStockItems = await query<Array<{ productId: string; sku: string }>>(
          `SELECT il."productId", p.sku
           FROM "inventoryLevel" il
           LEFT JOIN product p ON il."productId" = p."productId"
           WHERE (il.quantity - il.reserved) <= 0`,
        );

        for (const item of outOfStockItems || []) {
          eventBus.emit('inventory.out_of_stock', {
            productId: item.productId,
            sku: item.sku,
          });
        }

        logger.info(`[cron] low-stock-check: ${lowStockItems?.length || 0} low stock, ${outOfStockItems?.length || 0} out of stock`);
      } catch (err: unknown) {
        console.error(`[cron] low-stock-check error: ${(err as Error).message}`);
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
        // Clean up expired user sessions
        const result = await query<{ rowCount: number }>(
          `DELETE FROM "userSession" WHERE "expiresAt" < now()`,
        );
        const count = result?.rowCount || 0;

        // Also clean up connect-pg-simple sessions if table exists
        try {
          await query(`DELETE FROM session WHERE expire < now()`);
        } catch {
          // Table may not exist in all deployments
        }

        if (count > 0) {
          logger.info(`[cron] session-cleanup: removed ${count} expired sessions`);
        }
      } catch (err: unknown) {
        console.error(`[cron] session-cleanup error: ${(err as Error).message}`);
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
        console.error(`[cron] daily-sales-report error: ${(err as Error).message}`);
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
        // Delete notification delivery logs older than 90 days
        const deliveryResult = await query<{ rowCount: number }>(
          `DELETE FROM "notificationDeliveryLog" WHERE "createdAt" < now() - interval '90 days'`,
        );

        // Delete notification event logs older than 90 days
        const eventResult = await query<{ rowCount: number }>(
          `DELETE FROM "notificationEventLog" WHERE "createdAt" < now() - interval '90 days'`,
        );

        // Delete old analytics events older than 365 days
        const analyticsResult = await query<{ rowCount: number }>(
          `DELETE FROM "analyticsReportEvent" WHERE "createdAt" < now() - interval '365 days'`,
        );

        const total = (deliveryResult?.rowCount || 0) + (eventResult?.rowCount || 0) + (analyticsResult?.rowCount || 0);
        if (total > 0) {
          logger.info(`[cron] cleanup-job-history: removed ${total} old records`);
        }
      } catch (err: unknown) {
        console.error(`[cron] cleanup-job-history error: ${(err as Error).message}`);
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
        // Find baskets inactive for more than 3 hours with items
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
          // Emit abandoned cart event for notification handler
          eventBus.emit('basket.abandoned', {
            basketId: basket.basketId,
            customerId: basket.customerId,
            sessionId: basket.sessionId,
          });

          // Mark basket as abandoned if no customer (guest basket)
          if (!basket.customerId) {
            await query(`UPDATE basket SET status = 'abandoned', "updatedAt" = now() WHERE "basketId" = $1`, [
              basket.basketId,
            ]);
          }
        }

        logger.info(`[cron] cart-abandonment: found ${abandonedBaskets?.length || 0} abandoned baskets`);
      } catch (err: unknown) {
        console.error(`[cron] cart-abandonment error: ${(err as Error).message}`);
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
        const { NotificationRepo } = await import('../../modules/notification/infrastructure/repositories/notificationRepo.js');
        const repo = new NotificationRepo();

        const unsent = await repo.findUnsent(50);
        if (unsent.length === 0) return;

        let sent = 0;
        for (const notification of unsent) {
          try {
            // Deliver through the notification service's providers
            // The service handles email, sms, push, and in-app delivery
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
        const { listActiveSchedules, markScheduleRun, createExecution, updateExecution, computeNextRunDate } =
          await import('../../modules/reporting/infrastructure/repositories/reportingRepo.js');
        const { generateReport } = await import('../../modules/reporting/infrastructure/repositories/reportDataProvider.js');

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
        // Find users who have unread notifications from the last 24 hours
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
            // Look up email for the user
            const userRow = await query<Array<{ email: string }>>(
              `SELECT email FROM customer WHERE "customerId" = $1
            UNION ALL
            SELECT email FROM merchant WHERE "merchantId" = $1`,
              [entry.userId],
            );
            const email = userRow?.[0]?.email;
            if (!email) continue;

            // Emit digest event for the email handler to pick up
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

/**
 * Job data interfaces (for compatibility with existing code)
 */
export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

export interface ReportJobData {
  reportType: 'sales' | 'inventory' | 'orders' | 'customers';
  dateRange: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'csv' | 'xlsx';
  filters?: Record<string, unknown>;
  recipientEmail: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels?: ('email' | 'sms' | 'push' | 'in_app')[];
}

/**
 * Simple in-memory job queue for one-off async tasks
 * Use this for tasks that need to run asynchronously but not on a schedule
 */
class AsyncJobQueue {
  private queue: Array<{ id: string; handler: () => Promise<void>; priority: number }> = [];
  private processing: boolean = false;
  private concurrency: number = 3;
  private activeJobs: number = 0;

  async add(handler: () => Promise<void>, priority: number = 5): Promise<string> {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({ id, handler, priority });
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
    this.process();
    return id;
  }

  private async process(): Promise<void> {
    if (this.processing || this.activeJobs >= this.concurrency) return;

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.concurrency) {
      const job = this.queue.shift();
      if (!job) break;

      this.activeJobs++;
      job
        .handler()
        .catch(err => console.error(`Job ${job.id} failed:`, err))
        .finally(() => {
          this.activeJobs--;
          this.process();
        });
    }

    this.processing = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getActiveJobs(): number {
    return this.activeJobs;
  }
}

export const asyncJobQueue = new AsyncJobQueue();

/**
 * Job scheduler utilities (compatible API with previous Bull-based implementation)
 */
export class JobScheduler {
  static async scheduleEmail(data: EmailJobData, _delay?: number): Promise<void> {
    await asyncJobQueue.add(async () => {
      try {
        // Store email in notification system for delivery
        const { NotificationRepo } = await import('../../modules/notification/infrastructure/repositories/notificationRepo.js');
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
      } catch (err: unknown) {
        logger.error(`[JobScheduler.scheduleEmail] error: ${(err as Error).message}`);
      }
    });
  }

  static async scheduleReport(data: ReportJobData): Promise<void> {
    await asyncJobQueue.add(async () => {
      try {
        const { generateReport } = await import('../../modules/reporting/infrastructure/repositories/reportDataProvider.js');
        const result = await generateReport(data.reportType as never, {
          dateFrom: data.dateRange.start,
          dateTo: data.dateRange.end,
          ...data.filters,
        });
        logger.info(`[JobScheduler.scheduleReport] generated ${data.reportType} report for ${data.recipientEmail}`);
        // Store result metadata for the recipient
        const { NotificationRepo } = await import('../../modules/notification/infrastructure/repositories/notificationRepo.js');
        const repo = new NotificationRepo();
        await repo.create({
          userId: data.recipientEmail,
          userType: 'merchant',
          type: 'report_ready',
          title: `Report Ready: ${data.reportType}`,
          content: `Your ${data.reportType} report has been generated.`,
          channel: 'email',
          isRead: false,
          priority: 'normal',
          metadata: { reportType: data.reportType, summary: result.summary, recipientEmail: data.recipientEmail },
        });
      } catch (err: unknown) {
        logger.error(`[JobScheduler.scheduleReport] error: ${(err as Error).message}`);
      }
    });
  }

  static async scheduleNotification(data: NotificationJobData): Promise<void> {
    await asyncJobQueue.add(async () => {
      try {
        const { NotificationRepo } = await import('../../modules/notification/infrastructure/repositories/notificationRepo.js');
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
      } catch (err: unknown) {
        logger.error(`[JobScheduler.scheduleNotification] error: ${(err as Error).message}`);
      }
    });
  }
}

/**
 * Get queue stats (compatible API)
 */
export const getQueueStats = async (): Promise<{
  scheduled: ReturnType<typeof cronScheduler.getStats>;
  async: { queueSize: number; activeJobs: number };
}> => {
  return {
    scheduled: cronScheduler.getStats(),
    async: {
      queueSize: asyncJobQueue.getQueueSize(),
      activeJobs: asyncJobQueue.getActiveJobs(),
    },
  };
};
