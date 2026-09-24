import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'promotion',
  description: 'Promotional campaigns, discounts',
  requirement: 'optional',
  dependsOn: ['product'],
  routes: [
    { path: '/customer/promotion', auth: 'customer' },
    { path: '/business/promotion', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['promotion', 'promotionRule'] },
};
