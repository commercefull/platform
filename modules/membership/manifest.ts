import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'membership',
  description: 'Membership tiers, benefits',
  requirement: 'optional',
  dependsOn: ['customer'],
  routes: [
    { path: '/customer/membership', auth: 'customer' },
    { path: '/business/membership', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['membership', 'membershipTier'] },
};
