/**
 * Reporting Scheduled Jobs
 *
 * Runs due report schedules and records executions.
 * Also wires the report job creator so libs/jobs can delegate to
 * this module's infrastructure without importing it.
 * Collected by boot/scheduledJobs.ts at app boot.
 */

import { logger } from '../../libs/logger';
import { MINUTES, ScheduledJobDefinition, setReportCreator, JobScheduler } from '../../libs/jobs/cronScheduler';
import type { ReportJobData } from '../../libs/jobs/cronScheduler';
import { generateReport } from './infrastructure/repositories/reportDataProvider';
import {
  listActiveSchedules,
  markScheduleRun,
  createExecution,
  updateExecution,
  computeNextRunDate,
} from './infrastructure/repositories/reportingRepo';

/**
 * Wire the report creator so JobScheduler can delegate to module
 * infrastructure without libs/ importing from modules/.
 */
export function wireReportJobCreator(): void {
  setReportCreator(async (data: ReportJobData) => {
    const result = await generateReport(data.reportType as never, {
      dateFrom: data.dateRange.start,
      dateTo: data.dateRange.end,
      ...data.filters,
    });
    logger.info(`[JobScheduler.scheduleReport] generated ${data.reportType} report for ${data.recipientEmail}`);
    await JobScheduler.scheduleNotification({
      userId: data.recipientEmail,
      type: 'report_ready',
      title: `Report Ready: ${data.reportType}`,
      message: `Your ${data.reportType} report has been generated.`,
      channels: ['email'],
      data: { reportType: data.reportType, summary: result.summary as Record<string, unknown>, recipientEmail: data.recipientEmail },
    });
  });
}

export const scheduledJobs: ScheduledJobDefinition[] = [
  {
    // Generate scheduled reports every 15 minutes
    id: 'report-generator',
    name: 'Report Generator',
    handler: async () => {
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
    intervalMs: 15 * MINUTES,
  },
];
