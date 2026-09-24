/**
 * Scheduled Jobs Initialization
 *
 * Collects module-owned job definitions (`modules/<m>/scheduledJobs.ts`)
 * and registers them with the cronScheduler at application boot.
 * Job creators (notification, email, report) are wired by their owning
 * modules so libs/jobs stays free of module imports.
 */

import { cronScheduler } from '../libs/jobs/cronScheduler';
import type { ScheduledJobDefinition } from '../libs/jobs/cronScheduler';
import { moduleRegistry } from './moduleManifests';

import { scheduledJobs as inventoryJobs } from '../modules/inventory/scheduledJobs';
import { scheduledJobs as identityJobs } from '../modules/identity/scheduledJobs';
import { scheduledJobs as analyticsJobs } from '../modules/analytics/scheduledJobs';
import { scheduledJobs as basketJobs } from '../modules/basket/scheduledJobs';
import { scheduledJobs as notificationJobs, wireNotificationJobCreators } from '../modules/notification/scheduledJobs';
import { scheduledJobs as reportingJobs, wireReportJobCreator } from '../modules/reporting/scheduledJobs';

const jobModules: { module: string; jobs: ScheduledJobDefinition[] }[] = [
  { module: 'inventory', jobs: inventoryJobs },
  { module: 'identity', jobs: identityJobs },
  { module: 'analytics', jobs: analyticsJobs },
  { module: 'basket', jobs: basketJobs },
  { module: 'notification', jobs: notificationJobs },
  { module: 'reporting', jobs: reportingJobs },
];

/**
 * Initialize all scheduled jobs.
 * Call this from app.ts or main entry point.
 */
export const initializeScheduledJobs = (): void => {
  // Wire job creators first so JobScheduler can delegate to module infrastructure
  wireNotificationJobCreators();
  wireReportJobCreator();

  for (const { module, jobs } of jobModules) {
    if (!moduleRegistry.isEnabled(module)) continue;
    for (const job of jobs) {
      cronScheduler.registerJob(job.id, job.name, job.handler, job.intervalMs, job.startImmediately);
    }
  }
};
