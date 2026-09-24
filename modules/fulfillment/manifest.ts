import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'fulfillment',
  description: 'Order fulfillment, packing, shipping labels',
  requirement: 'optional',
  dependsOn: ['order', 'inventory'],
  routes: [
    { path: '/business/fulfillment', auth: 'organization' },
    { path: '/customer/fulfillment', auth: 'customer' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: ['order.paid', 'fulfillment.created', 'fulfillment.shipped', 'fulfillment.delivered'],
    publishes: ['fulfillment.created', 'fulfillment.shipped', 'fulfillment.delivered'],
  },
  tables: { names: ['fulfillment', 'fulfillmentItem'] },
};
