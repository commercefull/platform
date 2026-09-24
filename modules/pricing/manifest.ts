import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'pricing',
  description: 'Price lists, price rules, bulk pricing',
  requirement: 'optional',
  dependsOn: ['product'],
  routes: [{ path: '/business/pricing', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['priceList', 'priceRule'] },
};
