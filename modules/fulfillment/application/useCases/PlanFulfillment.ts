/**
 * PlanFulfillment Use Case
 *
 * Groups order items by optimal fulfillment source, enabling split fulfillments
 * where different items ship from different locations.
 */

import { OrderRouter } from '../../../order';
import { logger } from '../../../../libs/logger';
import { FulfillmentSourcePort, FulfillableStore } from '../../domain/repositories/FulfillmentSourceRepository';

export interface FulfillmentGroupItem {
  orderItemId: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface FulfillmentGroup {
  sourceType: 'warehouse' | 'store';
  sourceId: string;
  sourceName: string;
  shipFromAddress: Record<string, unknown>;
  items: FulfillmentGroupItem[];
}

export interface FulfillmentPlanResult {
  groups: FulfillmentGroup[];
  isSplit: boolean;
}

function toRoutableStore(store: FulfillableStore) {
  return {
    storeId: store.storeId,
    name: store.name,
    latitude: store.address?.latitude,
    longitude: store.address?.longitude,
    canFulfillOnline: store.settings?.allowOnlineOrdering ?? false,
    canPickupInStore: store.settings?.pickup?.enabled ?? false,
    localDeliveryEnabled: store.settings?.localDelivery?.enabled ?? false,
    priority: store.priority,
  };
}

function storeShipFromAddress(store: FulfillableStore): Record<string, unknown> {
  return {
    firstName: store.name,
    lastName: '',
    addressLine1: store.address?.line1 ?? '',
    addressLine2: store.address?.line2,
    city: store.address?.city ?? '',
    state: store.address?.state ?? '',
    postalCode: store.address?.postalCode ?? '',
    countryCode: store.address?.country ?? '',
  };
}

export class PlanFulfillmentUseCase {
  constructor(
    private readonly orderRouter: Pick<OrderRouter, 'determineFulfillmentStore'>,
    private readonly sources: FulfillmentSourcePort,
  ) {}

  /**
   * Plan fulfillment by attempting to group items by the best source.
   * If all items can be fulfilled from one store, returns a single group.
   * Otherwise, splits items across multiple sources.
   */
  async execute(items: FulfillmentGroupItem[]): Promise<FulfillmentPlanResult> {
    if (items.length === 0) {
      return { groups: [], isSplit: false };
    }

    const [stores, fallbackWarehouse] = await Promise.all([
      this.sources.findFulfillableStores(),
      this.sources.findDefaultWarehouse(),
    ]);

    const groups: FulfillmentGroup[] = [];
    const unassigned: FulfillmentGroupItem[] = [];
    const routableStores = stores.map(toRoutableStore);

    // Try to find a single store that can fulfill all items
    try {
      const routingResult = await this.orderRouter.determineFulfillmentStore(
        {
          orderId: '_plan',
          fulfillmentType: 'shipping',
          items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        },
        routableStores,
      );

      const selectedStore = stores.find(s => s.storeId === routingResult.storeId);
      if (selectedStore && selectedStore.address) {
        groups.push({
          sourceType: 'store',
          sourceId: selectedStore.storeId,
          sourceName: selectedStore.name,
          shipFromAddress: storeShipFromAddress(selectedStore),
          items,
        });
        return { groups, isSplit: false };
      }
    } catch (err: unknown) {
      logger.info(`PlanFulfillment: single-store routing failed: ${(err as Error).message}`);
    }

    // Split: try to assign each item to the best store with inventory
    for (const item of items) {
      let assigned = false;
      try {
        const routingResult = await this.orderRouter.determineFulfillmentStore(
          {
            orderId: '_plan',
            fulfillmentType: 'shipping',
            items: [{ productId: item.productId, variantId: item.variantId, quantity: item.quantity }],
          },
          routableStores,
        );

        const selectedStore = stores.find(s => s.storeId === routingResult.storeId);
        if (selectedStore && selectedStore.address) {
          // Check if we already have a group for this store
          let group = groups.find(g => g.sourceId === selectedStore.storeId);
          if (!group) {
            group = {
              sourceType: 'store',
              sourceId: selectedStore.storeId,
              sourceName: selectedStore.name,
              shipFromAddress: storeShipFromAddress(selectedStore),
              items: [],
            };
            groups.push(group);
          }
          group.items.push(item);
          assigned = true;
        }
      } catch {
        // This item can't be fulfilled from any store
      }

      if (!assigned) {
        unassigned.push(item);
      }
    }

    // Assign unassigned items to fallback warehouse
    if (unassigned.length > 0 && fallbackWarehouse) {
      groups.push({
        sourceType: 'warehouse',
        sourceId: fallbackWarehouse.distributionWarehouseId,
        sourceName: fallbackWarehouse.name || 'Warehouse',
        shipFromAddress: {
          firstName: fallbackWarehouse.name || 'Warehouse',
          lastName: '',
          addressLine1: fallbackWarehouse.addressLine1 || '',
          addressLine2: fallbackWarehouse.addressLine2 || undefined,
          city: fallbackWarehouse.city || '',
          state: fallbackWarehouse.state || '',
          postalCode: fallbackWarehouse.postalCode || '',
          countryCode: fallbackWarehouse.country || '',
        },
        items: unassigned,
      });
    } else if (unassigned.length > 0) {
      // No warehouse fallback — items remain unassigned
      logger.warn(`PlanFulfillment: ${unassigned.length} items could not be assigned to any source`);
    }

    return { groups, isSplit: groups.length > 1 };
  }
}
