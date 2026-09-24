import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'loyalty',
  description: 'Loyalty points, tier management',
  requirement: 'optional',
  dependsOn: ['customer', 'order'],
  routes: [
    { path: '/customer/loyalty', auth: 'customer' },
    { path: '/business/loyalty', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: ['order.completed', 'loyalty.points_earned', 'loyalty.points_redeemed', 'loyalty.tier_upgraded'],
    publishes: ['loyalty.points_earned', 'loyalty.points_redeemed', 'loyalty.tier_upgraded'],
  },
  tables: { names: ['loyaltyPoint', 'loyaltyTier', 'loyaltyProgram'] },
};
