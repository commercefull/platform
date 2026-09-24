import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'pagebuilder',
  description: 'Page builder — block schema registry, drag-and-drop editor, live preview with theme integration',
  requirement: 'optional',
  dependsOn: ['content', 'theme'],
  routes: [{ path: '/business/page-builder', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: [],
    publishes: [
      'pagebuilder.draft.created',
      'pagebuilder.draft.updated',
      'pagebuilder.draft.deleted',
      'pagebuilder.draft.published',
      'pagebuilder.draft.unpublished',
      'pagebuilder.block.added',
      'pagebuilder.block.removed',
      'pagebuilder.block.moved',
      'pagebuilder.block.updated',
      'pagebuilder.blocks.reordered',
    ],
  },
  tables: { names: ['pageDraft'] },
  featureFlagKey: 'module.pagebuilder.enabled',
};
