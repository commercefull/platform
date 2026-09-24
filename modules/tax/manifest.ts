import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'tax',
  description: 'Tax calculation, tax rates, tax zones',
  requirement: 'optional',
  dependsOn: ['product'],
  routes: [
    { path: '/customer/tax', auth: 'customer' },
    { path: '/business/tax', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['taxRate', 'taxZone'] },
};
