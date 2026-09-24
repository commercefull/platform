import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'warehouse',
  description: 'Warehouse management, stock transfers',
  requirement: 'optional',
  dependsOn: ['inventory'],
  routes: [{ path: '/business/warehouse', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['distributionWarehouse'] },
};
