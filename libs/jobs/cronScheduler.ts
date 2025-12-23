/**
 * Cron Job Scheduler
 * A lightweight background job scheduler that runs directly on the EC2 instance.
 * Uses Node.js setInterval for recurring tasks - no external dependencies like Redis/Bull.
 *
 * For production, these jobs can also be triggered via system crontab on EC2.
 */

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
    } catch (error: any) {
      const result: JobResult = {
        jobId: id,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
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
    Array.from(this.intervals.entries()).forEach(([id, interval]) => {
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
      // TODO: Import and call inventory service
      // await inventoryService.releaseExpiredReservations();
    },
    5 * MINUTES,
  );

  // Sync inventory every 6 hours
  cronScheduler.registerJob(
    'inventory-sync',
    'Inventory Sync',
    async () => {
      // TODO: Implement inventory sync logic
    },
    6 * HOURS,
  );

  // Check low stock items every hour
  cronScheduler.registerJob(
    'low-stock-check',
    'Low Stock Check',
    async () => {
      // TODO: Check inventory levels and send alerts
    },
    1 * HOURS,
  );

  // Cleanup old sessions every 30 minutes
  cronScheduler.registerJob(
    'session-cleanup',
    'Session Cleanup',
    async () => {
      // TODO: Remove expired sessions from database
    },
    30 * MINUTES,
  );

  // Daily sales report at midnight (runs every 24 hours)
  cronScheduler.registerJob(
    'daily-sales-report',
    'Daily Sales Report',
    async () => {
      // TODO: Generate and email daily sales report
    },
    24 * HOURS,
  );

  // Cleanup old job history every day
  cronScheduler.registerJob(
    'cleanup-job-history',
    'Cleanup Job History',
    async () => {
      // TODO: Remove old logs and notifications
    },
    24 * HOURS,
  );

  // Cart abandonment reminders every hour
  cronScheduler.registerJob(
    'cart-abandonment',
    'Cart Abandonment Reminders',
    async () => {
      // TODO: Find abandoned carts and send reminder emails
    },
    1 * HOURS,
  );
};

/**
 * Job data interfaces (for compatibility with existing code)
 */
export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

export interface InventorySyncJobData {
  type: 'sync' | 'reorder' | 'alert';
  warehouseId?: string;
  productId?: string;
  data?: Record<string, any>;
}

export interface ReportJobData {
  reportType: 'sales' | 'inventory' | 'orders' | 'customers';
  dateRange: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'csv' | 'xlsx';
  filters?: Record<string, any>;
  recipientEmail: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
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
      // TODO: Integrate with actual email service (SendGrid, SES, etc.)
    });
  }

  static async scheduleInventorySync(data: InventorySyncJobData, _priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    await asyncJobQueue.add(async () => {
      // TODO: Implement inventory sync logic
    });
  }

  static async scheduleReport(data: ReportJobData): Promise<void> {
    await asyncJobQueue.add(async () => {
      // TODO: Generate and send report
    });
  }

  static async scheduleNotification(data: NotificationJobData): Promise<void> {
    await asyncJobQueue.add(async () => {
      // TODO: Send notification via appropriate channels
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
