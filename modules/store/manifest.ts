import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'store',
  description: 'Store management, pickup, local delivery',
  requirement: 'optional',
  dependsOn: ['inventory'],
  routes: [
    { path: '/customer/store', auth: 'customer' },
    { path: '/business/store', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: ['store.created', 'store.inventory_linked', 'store.pickup_configured'],
    publishes: ['store.created', 'store.inventory_linked', 'store.pickup_configured'],
  },
  tables: { names: ['store', 'storeSettings'] },
};
