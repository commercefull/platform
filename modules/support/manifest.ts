import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'support',
  description: 'Support tickets, customer service',
  requirement: 'optional',
  dependsOn: ['customer'],
  routes: [
    { path: '/customer/support', auth: 'customer' },
    { path: '/business/support', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: ['support.ticket_created', 'support.ticket_resolved'] },
  tables: { names: ['supportTicket', 'supportMessage'] },
};
