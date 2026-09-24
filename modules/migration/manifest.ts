import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'migration',
  description: 'External platform migration — import jobs, source-to-platform ID mappings, error tracking',
  requirement: 'optional',
  dependsOn: ['identity', 'organization'],
  routes: [{ path: '/business/migration', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: [],
    publishes: [
      'migration.job.created',
      'migration.job.started',
      'migration.job.completed',
      'migration.job.failed',
      'migration.job.cancelled',
      'migration.record.imported',
      'migration.record.skipped',
      'migration.record.error',
    ],
  },
  tables: { names: ['importJob', 'importMapping', 'importError'] },
  featureFlagKey: 'module.migration.enabled',
};
