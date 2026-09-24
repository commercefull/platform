import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'supplier',
  description: 'Supplier management, purchase orders',
  requirement: 'optional',
  dependsOn: ['inventory'],
  routes: [{ path: '/business/supplier', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['supplier'] },
};
