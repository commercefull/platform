import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'checkout',
  description: 'Checkout sessions, payment capture flow',
  requirement: 'optional',
  dependsOn: ['basket', 'order', 'payment'],
  routes: [{ path: '/customer/checkout', auth: 'customer' }],
  graphql: { enabled: true },
  events: { subscribes: ['checkout.payment_captured', 'checkout.failed'], publishes: ['checkout.completed', 'checkout.failed'] },
  tables: { names: ['checkoutSession'] },
};
