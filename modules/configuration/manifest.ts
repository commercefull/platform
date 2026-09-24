import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'configuration',
  description: 'System configuration, feature flags',
  requirement: 'required',
  routes: [{ path: '/business/config', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: ['config.updated', 'config.flag_toggled'] },
  tables: { names: ['systemConfiguration'] },
};
