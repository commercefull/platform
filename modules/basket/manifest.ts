import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'basket',
  description: 'Shopping cart management',
  requirement: 'optional',
  dependsOn: ['product'],
  routes: [
    { path: '/customer/basket', auth: 'customer' },
    { path: '/business/basket', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: ['basket.abandoned'], publishes: ['basket.abandoned'] },
  tables: { names: ['basket', 'basketItem'] },
};
