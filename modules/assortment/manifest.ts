import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'assortment',
  description: 'Collections, smart collections, and per-store product assortment',
  requirement: 'optional',
  dependsOn: ['product', 'store'],
  routes: [
    { path: '/customer/assortment', auth: 'customer' },
    { path: '/business/assortment', auth: 'organization' },
  ],
  events: {
    subscribes: [],
    publishes: ['collection.created', 'collection.updated', 'collection.deleted', 'assortment.updated'],
  },
  tables: {
    names: [
      'assortmentCollection',
      'assortmentCollectionMap',
      'assortmentStore',
      'assortmentStoreEntry',
      'assortmentMerchandisingRule',
      'assortmentCategoryManualOrder',
    ],
  },
};
