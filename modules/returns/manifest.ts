import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'returns',
  description: 'Returns, exchanges & store credit — explicit state machine, carrier return labels, store-credit ledger, warranty claims',
  requirement: 'optional',
  dependsOn: ['order'],
  routes: [
    { path: '/business/returns', auth: 'organization' },
    { path: '/business/store-credit', auth: 'organization' },
  ],
  graphql: { enabled: false },
  events: {
    subscribes: ['order.completed', 'order.cancelled'],
    publishes: [
      'return.created',
      'return.approved',
      'return.denied',
      'return.in_transit',
      'return.received',
      'return.inspected',
      'return.completed',
      'return.cancelled',
    ],
  },
  tables: { names: ['orderReturn', 'orderReturnItem', 'storeCreditLedger'] },
  featureFlagKey: 'module.returns.enabled',
};
