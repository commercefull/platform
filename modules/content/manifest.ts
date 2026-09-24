import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'content',
  description: 'CMS, pages, blog, content blocks',
  requirement: 'optional',
  routes: [
    { path: '/customer/content', auth: 'customer' },
    { path: '/business/content', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['contentPage', 'contentBlock'] },
};
