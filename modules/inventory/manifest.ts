import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'inventory',
  description: 'Stock management, reservations, low-stock alerts',
  requirement: 'optional',
  dependsOn: ['product'],
  routes: [
    { path: '/customer/inventory', auth: 'customer' },
    { path: '/business/inventory', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: ['order.created', 'order.cancelled', 'order.payment_failed'],
    publishes: ['inventory.low', 'inventory.out_of_stock', 'inventory.reserved', 'inventory.released', 'inventory.reservation_failed'],
  },
  tables: { names: ['inventoryItem', 'inventoryLocation', 'inventoryReservation', 'inventoryAdjustment'] },
};
