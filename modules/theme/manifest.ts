import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'theme',
  description: 'Theme engine — theme registry, per-store overrides, built-in themes, CSS variable generation',
  requirement: 'optional',
  dependsOn: ['store'],
  routes: [{ path: '/business/theme', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: [],
    publishes: [
      'theme.created',
      'theme.updated',
      'theme.deleted',
      'theme.activated',
      'theme.archived',
      'theme.assigned',
      'theme.unassigned',
      'theme.override.created',
      'theme.override.updated',
      'theme.override.deleted',
    ],
  },
  tables: { names: ['theme', 'themeOverride', 'themeAssignment'] },
  featureFlagKey: 'module.theme.enabled',
};
