/**
 * Fulfillment Planner Service
 *
 * Groups order items by optimal fulfillment source, enabling split fulfillments
 * where different items ship from different locations.
 */

import { OrderRouter } from '../../../order/domain/services/OrderRouter';
import { logger } from '../../../../libs/logger';

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

export class FulfillmentPlanner {
  constructor(
    private readonly orderRouter: OrderRouter,
    private readonly stores: Array<{
      storeId: string;
      name: string;
      address?: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string; latitude?: number; longitude?: number };
      settings?: { allowOnlineOrdering?: boolean; pickup?: { enabled?: boolean }; localDelivery?: { enabled?: boolean } };
      priority?: number;
    }>,
    private readonly fallbackWarehouse: {
      distributionWarehouseId: string;
      name?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
      email?: string;
    } | null,
  ) {}

  /**
   * Plan fulfillment by attempting to group items by the best source.
   * If all items can be fulfilled from one store, returns a single group.
   * Otherwise, splits items across multiple sources.
   */
  async plan(items: FulfillmentGroupItem[]): Promise<FulfillmentPlanResult> {
    if (items.length === 0) {
      return { groups: [], isSplit: false };
    }

    const groups: FulfillmentGroup[] = [];
    const unassigned: FulfillmentGroupItem[] = [];

    // Try to find a single store that can fulfill all items
    try {
      const routingResult = await this.orderRouter.determineFulfillmentStore(
        {
          orderId: '_plan',
          fulfillmentType: 'shipping',
          items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        },
        this.stores.map(s => ({
          storeId: s.storeId,
          name: s.name,
          latitude: s.address?.latitude,
          longitude: s.address?.longitude,
          canFulfillOnline: s.settings?.allowOnlineOrdering ?? false,
          canPickupInStore: s.settings?.pickup?.enabled ?? false,
          localDeliveryEnabled: s.settings?.localDelivery?.enabled ?? false,
          priority: s.priority,
        })),
      );

      const selectedStore = this.stores.find(s => s.storeId === routingResult.storeId);
      if (selectedStore && selectedStore.address) {
        groups.push({
          sourceType: 'store',
          sourceId: selectedStore.storeId,
          sourceName: selectedStore.name,
          shipFromAddress: {
            firstName: selectedStore.name,
            lastName: '',
            addressLine1: selectedStore.address.line1,
            addressLine2: selectedStore.address.line2,
            city: selectedStore.address.city,
            state: selectedStore.address.state,
            postalCode: selectedStore.address.postalCode,
            countryCode: selectedStore.address.country,
          },
          items,
        });
        return { groups, isSplit: false };
      }
    } catch (err: unknown) {
      logger.info(`FulfillmentPlanner: single-store routing failed: ${(err as Error).message}`);
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
          this.stores.map(s => ({
            storeId: s.storeId,
            name: s.name,
            latitude: s.address?.latitude,
            longitude: s.address?.longitude,
            canFulfillOnline: s.settings?.allowOnlineOrdering ?? false,
            canPickupInStore: s.settings?.pickup?.enabled ?? false,
            localDeliveryEnabled: s.settings?.localDelivery?.enabled ?? false,
            priority: s.priority,
          })),
        );

        const selectedStore = this.stores.find(s => s.storeId === routingResult.storeId);
        if (selectedStore && selectedStore.address) {
          // Check if we already have a group for this store
          let group = groups.find(g => g.sourceId === selectedStore.storeId);
          if (!group) {
            group = {
              sourceType: 'store',
              sourceId: selectedStore.storeId,
              sourceName: selectedStore.name,
              shipFromAddress: {
                firstName: selectedStore.name,
                lastName: '',
                addressLine1: selectedStore.address.line1,
                addressLine2: selectedStore.address.line2,
                city: selectedStore.address.city,
                state: selectedStore.address.state,
                postalCode: selectedStore.address.postalCode,
                countryCode: selectedStore.address.country,
              },
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
    if (unassigned.length > 0 && this.fallbackWarehouse) {
      groups.push({
        sourceType: 'warehouse',
        sourceId: this.fallbackWarehouse.distributionWarehouseId,
        sourceName: this.fallbackWarehouse.name || 'Warehouse',
        shipFromAddress: {
          firstName: this.fallbackWarehouse.name || 'Warehouse',
          lastName: '',
          addressLine1: this.fallbackWarehouse.addressLine1 || '',
          addressLine2: this.fallbackWarehouse.addressLine2 || undefined,
          city: this.fallbackWarehouse.city || '',
          state: this.fallbackWarehouse.state || '',
          postalCode: this.fallbackWarehouse.postalCode || '',
          countryCode: this.fallbackWarehouse.country || '',
        },
        items: unassigned,
      });
    } else if (unassigned.length > 0) {
      // No warehouse fallback — put in a placeholder group
      logger.warn(`FulfillmentPlanner: ${unassigned.length} items could not be assigned to any source`);
    }

    return { groups, isSplit: groups.length > 1 };
  }
}
