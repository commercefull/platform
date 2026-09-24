import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'audit',
  description: 'Immutable audit log',
  requirement: 'optional',
  routes: [{ path: '/business/audit', auth: 'organization' }],
  graphql: { enabled: false },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['auditLog'] },
  featureFlagKey: 'module.audit.enabled',
};
