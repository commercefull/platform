import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'shipping',
  description: 'Shipping methods, rates, zones',
  requirement: 'optional',
  dependsOn: ['order'],
  routes: [
    { path: '/customer/shipping', auth: 'customer' },
    { path: '/business/shipping', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['shippingMethod', 'shippingZone', 'shippingRate', 'shippingSurcharge'] },
};
