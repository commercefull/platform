import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'notification',
  description: 'In-app, email, push notifications',
  requirement: 'optional',
  dependsOn: ['identity'],
  routes: [
    { path: '/customer/notification', auth: 'customer' },
    { path: '/business/notification', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: ['*'], publishes: [] },
  tables: { names: ['notification'] },
};
