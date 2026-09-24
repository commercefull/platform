import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'gdpr',
  description: 'GDPR data requests, cookie consent',
  requirement: 'optional',
  dependsOn: ['customer'],
  routes: [
    { path: '/customer/gdpr', auth: 'customer' },
    { path: '/business/gdpr', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['gdprDataRequest', 'gdprCookieConsent'] },
};
