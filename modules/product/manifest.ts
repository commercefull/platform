import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'product',
  description: 'Product catalog, variants, categories, attributes, bundles',
  requirement: 'required',
  routes: [
    { path: '/customer/products', auth: 'customer' },
    { path: '/business/products', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: ['product.created', 'product.updated', 'product.deleted'],
    publishes: ['product.created', 'product.updated', 'product.deleted'],
  },
  tables: { names: ['product', 'productVariant', 'productCategory', 'productAttribute', 'productBundle'] },
};
