import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'order',
  description: 'Order management, order history, status tracking',
  requirement: 'required',
  dependsOn: ['identity', 'product'],
  routes: [
    { path: '/customer/orders', auth: 'customer' },
    { path: '/business/orders', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: [
      'order.created',
      'order.paid',
      'order.cancelled',
      'order.payment_failed',
      'order.completed',
      'fulfillment.delivered',
      'order.status_changed',
    ],
    publishes: [
      'order.created',
      'order.paid',
      'order.cancelled',
      'order.completed',
      'order.payment_failed',
      'order.status_changed',
      'order.ready_for_pickup',
    ],
  },
  tables: { names: ['order', 'orderItem', 'orderStatusHistory', 'orderPaymentHistory'] },
};
