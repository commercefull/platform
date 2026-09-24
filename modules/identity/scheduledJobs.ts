/**
 * Identity Scheduled Jobs
 *
 * Expired session cleanup.
 * Collected by boot/scheduledJobs.ts at app boot.
 */

import { query } from '../../libs/db';
import { logger } from '../../libs/logger';
import { MINUTES, ScheduledJobDefinition } from '../../libs/jobs/cronScheduler';

export const scheduledJobs: ScheduledJobDefinition[] = [
  {
    // Cleanup old sessions every 30 minutes
    id: 'session-cleanup',
    name: 'Session Cleanup',
    handler: async () => {
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
    intervalMs: 30 * MINUTES,
  },
];
