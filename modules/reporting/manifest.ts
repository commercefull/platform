import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'reporting',
  description: 'Report generation, exports',
  requirement: 'optional',
  dependsOn: ['order', 'product'],
  routes: [{ path: '/business/reporting', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['report', 'reportRun'] },
};
