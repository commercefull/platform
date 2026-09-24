import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'integration',
  description:
    'Third-party integrations — marketing automation, email, accounting, custom webhooks with encrypted credentials and event subscriptions',
  requirement: 'optional',
  dependsOn: ['identity', 'organization'],
  routes: [{ path: '/business/integration', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: ['*'],
    publishes: [
      'integration.created',
      'integration.updated',
      'integration.activated',
      'integration.deactivated',
      'integration.deleted',
      'integration.credential.added',
      'integration.credential.updated',
      'integration.credential.expired',
      'integration.subscription.created',
      'integration.subscription.updated',
      'integration.dispatch.success',
      'integration.dispatch.failed',
    ],
  },
  tables: { names: ['integration', 'integrationCredential', 'integrationSubscription', 'integrationLog'] },
  featureFlagKey: 'module.integration.enabled',
};
