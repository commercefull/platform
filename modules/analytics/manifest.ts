import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'analytics',
  description: 'Analytics tracking, dashboards',
  requirement: 'optional',
  dependsOn: ['order', 'product'],
  routes: [{ path: '/business/analytics', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: ['*'], publishes: [] },
  tables: { names: ['analyticsEvent'] },
};
