/**
 * Recommendation scheduled jobs — nightly rebuild of the serving read
 * models (spec §6.3). Runs per organization that has any recommendation
 * data or an active catalog; organizations are discovered from the
 * product table.
 */

import type { ScheduledJobDefinition } from '../../libs/jobs/cronScheduler';
import { query } from '../../libs/db';
import { logger } from '../../libs/logger';
import { rebuildRecommendationsUseCase } from './application/useCases/wired';
import { eventBus } from '../../libs/events/eventBus';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const scheduledJobs: ScheduledJobDefinition[] = [
  {
    id: 'recommendation-nightly-rebuild',
    name: 'Recommendation nightly rebuild',
    intervalMs: TWENTY_FOUR_HOURS_MS,
    startImmediately: false,
    handler: async () => {
      const orgs = await query<Array<{ organizationId: string }>>(
        `SELECT DISTINCT "organizationId" FROM product WHERE "organizationId" IS NOT NULL AND "deletedAt" IS NULL`,
        [],
      );
      for (const org of orgs || []) {
        try {
          const started = Date.now();
          const result = await rebuildRecommendationsUseCase.execute({ organizationId: org.organizationId });
          await eventBus.emit('recommendation.rebuilt', {
            organizationId: org.organizationId,
            candidatesWritten: result.candidatesWritten,
            durationMs: Date.now() - started,
          });
        } catch (err) {
          logger.error('Recommendation rebuild failed for organization', { organizationId: org.organizationId, error: err });
        }
      }
    },
  },
];
