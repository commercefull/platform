import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'organization',
  description: 'Organization/merchant management',
  requirement: 'required',
  dependsOn: ['identity'],
  routes: [{ path: '/business/organization', auth: 'organization' }],
  graphql: { enabled: true },
  events: {
    subscribes: ['organization.approved', 'organization.settlement_created', 'organization.payout_processed'],
    publishes: ['organization.approved', 'organization.settlement_created', 'organization.payout_processed'],
  },
  tables: { names: ['merchant'] },
};
