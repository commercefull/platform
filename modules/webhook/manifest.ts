import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'webhook',
  description: 'Outbound webhook delivery',
  requirement: 'optional',
  routes: [{ path: '/business/webhook', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: ['*'], publishes: [] },
  tables: { names: ['webhookEndpoint', 'webhookDelivery'] },
};
