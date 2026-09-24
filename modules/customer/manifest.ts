import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'customer',
  description: 'Customer profiles, addresses, preferences',
  requirement: 'optional',
  dependsOn: ['identity'],
  routes: [
    { path: '/customer', auth: 'customer' },
    { path: '/business/customer', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: ['customer.registered', 'customer.deleted'], publishes: ['customer.registered', 'customer.updated'] },
  tables: { names: ['customer', 'customerAddress'] },
};
