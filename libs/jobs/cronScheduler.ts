/* eslint-disable @typescript-eslint/no-unused-vars */
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
      logger.warning('Job already exists', { id, hint: 'Use updateJob() to modify' });
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

    logger.info('Registered job', { name, id, intervalSeconds: intervalMs / 1000 });

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
      logger.warning('Job already running', { id });
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
        .catch(err => logger.error('Job failed', { id: job.id, error: err }))
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

const asyncJobQueue = new AsyncJobQueue();

// ── Job handler registration (dependency injection) ──────────────
// Modules are wired at boot via setNotificationCreator / setEmailCreator / setReportCreator.
// This keeps libs/ free of module imports.

type NotificationCreator = (data: NotificationJobData) => Promise<void>;
type EmailCreator = (data: EmailJobData) => Promise<void>;
type ReportCreator = (data: ReportJobData) => Promise<void>;

let notificationCreator: NotificationCreator | null = null;
let emailCreator: EmailCreator | null = null;
let reportCreator: ReportCreator | null = null;

export function setNotificationCreator(fn: NotificationCreator): void {
  notificationCreator = fn;
}

export function setEmailCreator(fn: EmailCreator): void {
  emailCreator = fn;
}

export function setReportCreator(fn: ReportCreator): void {
  reportCreator = fn;
}

/**
 * Job scheduler utilities (compatible API with previous Bull-based implementation)
 */
export class JobScheduler {
  static async scheduleEmail(data: EmailJobData, _delay?: number): Promise<void> {
    await asyncJobQueue.add(async () => {
      try {
        if (emailCreator) {
          await emailCreator(data);
        } else {
          logger.warning('[JobScheduler.scheduleEmail] no email creator registered');
        }
      } catch (err: unknown) {
        logger.error(`[JobScheduler.scheduleEmail] error: ${(err as Error).message}`);
      }
    });
  }

  static async scheduleReport(data: ReportJobData): Promise<void> {
    await asyncJobQueue.add(async () => {
      try {
        if (reportCreator) {
          await reportCreator(data);
        } else {
          logger.warning('[JobScheduler.scheduleReport] no report creator registered');
        }
      } catch (err: unknown) {
        logger.error(`[JobScheduler.scheduleReport] error: ${(err as Error).message}`);
      }
    });
  }

  static async scheduleNotification(data: NotificationJobData): Promise<void> {
    await asyncJobQueue.add(async () => {
      try {
        if (notificationCreator) {
          await notificationCreator(data);
        } else {
          logger.warning('[JobScheduler.scheduleNotification] no notification creator registered');
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
const getQueueStats = async (): Promise<{
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
