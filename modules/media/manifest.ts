import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'media',
  description: 'Media uploads, image management',
  requirement: 'optional',
  routes: [{ path: '/business/media', auth: 'organization' }],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['mediaAsset'] },
};
