import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'segment',
  description: 'CDP & customer segmentation — customer profiles, LTV/frequency/behaviour aggregates, dynamic segment definitions',
  requirement: 'optional',
  dependsOn: ['customer', 'order'],
  routes: [{ path: '/business/segment', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: ['order.created', 'order.completed', 'customer.registered'],
    publishes: ['segment.member_added', 'segment.member_removed'],
  },
  tables: { names: ['segmentDefinition', 'segmentMembership', 'customerProfile'] },
  featureFlagKey: 'module.segment.enabled',
};
