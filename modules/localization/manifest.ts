import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'localization',
  description: 'Translations, currency, locale management',
  requirement: 'optional',
  routes: [
    { path: '/customer/localization', auth: 'customer' },
    { path: '/business/localization', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['translation', 'currency', 'locale'] },
};
