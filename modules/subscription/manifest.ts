import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'subscription',
  description: 'Recurring billing, subscription plans',
  requirement: 'optional',
  dependsOn: ['customer', 'payment'],
  routes: [
    { path: '/customer/subscription', auth: 'customer' },
    { path: '/business/subscription', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: ['subscription.renewed', 'subscription.cancelled'],
    publishes: ['subscription.created', 'subscription.cancelled', 'subscription.renewed'],
  },
  tables: { names: ['subscription', 'subscriptionPlan'] },
};
