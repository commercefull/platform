import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'coupon',
  description: 'Coupon codes, redemption tracking',
  requirement: 'optional',
  dependsOn: ['promotion'],
  routes: [
    { path: '/customer/coupon', auth: 'customer' },
    { path: '/business/coupon', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['coupon', 'couponRedemption'] },
};
