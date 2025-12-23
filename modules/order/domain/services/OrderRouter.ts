/**
 * OrderRouter Domain Service
 *
 * Routes orders to appropriate store/warehouse for fulfillment.
 */

export interface Store {
  storeId: string;
  name: string;
  latitude?: number;
  longitude?: number;
  canFulfillOnline: boolean;
  canPickupInStore: boolean;
  localDeliveryEnabled: boolean;
  localDeliveryRadius?: number;
  priority?: number;
}

export interface CustomerLocation {
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  city?: string;
  country?: string;
}

export interface Order {
  orderId: string;
  fulfillmentType: 'shipping' | 'pickup' | 'local_delivery';
  customerLocation?: CustomerLocation;
  storeId?: string; // Pre-selected store for pickup
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
}

export interface RoutingResult {
  storeId: string;
  storeName: string;
  distance?: number;
  reason: string;
}

export class OrderRouter {
  constructor(
    private readonly storeRepository: any,
    private readonly inventoryRepository: any,
  ) {}

  /**
   * Route order to the most appropriate store for fulfillment
   */
  async routeOrderToStore(order: Order, availableStores: Store[]): Promise<RoutingResult> {
    // If customer selected a specific store for pickup
    if (order.fulfillmentType === 'pickup' && order.storeId) {
      const selectedStore = availableStores.find(s => s.storeId === order.storeId);
      if (selectedStore && selectedStore.canPickupInStore) {
        return {
          storeId: selectedStore.storeId,
          storeName: selectedStore.name,
          reason: 'Customer selected pickup store',
        };
      }
    }

    // Filter stores that can fulfill this order type
    const eligibleStores = this.filterEligibleStores(order, availableStores);

    if (eligibleStores.length === 0) {
      throw new Error('No eligible stores found for order fulfillment');
    }

    // Check inventory at each store
    const storesWithInventory = await this.checkInventoryAtStores(order, eligibleStores);

    if (storesWithInventory.length === 0) {
      throw new Error('No stores have sufficient inventory');
    }

    // Sort by best match
    const sortedStores = this.rankStores(order, storesWithInventory);

    return {
      storeId: sortedStores[0].storeId,
      storeName: sortedStores[0].name,
      distance: sortedStores[0].distance,
      reason: this.getRoutingReason(order, sortedStores[0]),
    };
  }

  /**
   * Determine pickup store based on customer location
   */
  async determinePickupStore(order: Order, customerLocation: CustomerLocation, availableStores: Store[]): Promise<RoutingResult> {
    const pickupStores = availableStores.filter(s => s.canPickupInStore);

    if (pickupStores.length === 0) {
      throw new Error('No pickup-enabled stores available');
    }

    // Sort by distance to customer
    const storesWithDistance = pickupStores
      .map(store => ({
        ...store,
        distance: this.calculateDistance(customerLocation, store),
      }))
      .sort((a, b) => a.distance - b.distance);

    // Find nearest store with inventory
    for (const store of storesWithDistance) {
      const hasInventory = await this.storeHasAllItems(store.storeId, order.items);
      if (hasInventory) {
        return {
          storeId: store.storeId,
          storeName: store.name,
          distance: store.distance,
          reason: 'Nearest store with available inventory',
        };
      }
    }

    // If no single store has all items, return nearest
    return {
      storeId: storesWithDistance[0].storeId,
      storeName: storesWithDistance[0].name,
      distance: storesWithDistance[0].distance,
      reason: 'Nearest pickup store (may require transfer)',
    };
  }

  /**
   * Determine fulfillment store for online orders
   */
  async determineFulfillmentStore(order: Order, availableStores: Store[]): Promise<RoutingResult> {
    const fulfillmentStores = availableStores.filter(s => s.canFulfillOnline);

    if (fulfillmentStores.length === 0) {
      throw new Error('No fulfillment-enabled stores available');
    }

    // Check inventory and rank stores
    const storesWithInventory: Array<Store & { inventoryScore: number; distance: number }> = [];

    for (const store of fulfillmentStores) {
      const inventoryScore = await this.calculateInventoryScore(store.storeId, order.items);
      if (inventoryScore > 0) {
        storesWithInventory.push({
          ...store,
          inventoryScore,
          distance: order.customerLocation ? this.calculateDistance(order.customerLocation, store) : Infinity,
        });
      }
    }

    if (storesWithInventory.length === 0) {
      throw new Error('No stores have inventory for fulfillment');
    }

    // Sort by inventory score (higher is better), then by distance
    storesWithInventory.sort((a, b) => {
      if (b.inventoryScore !== a.inventoryScore) {
        return b.inventoryScore - a.inventoryScore;
      }
      return a.distance - b.distance;
    });

    const selectedStore = storesWithInventory[0];
    return {
      storeId: selectedStore.storeId,
      storeName: selectedStore.name,
      distance: selectedStore.distance,
      reason: selectedStore.inventoryScore === 100 ? 'Full inventory available at store' : 'Best inventory availability',
    };
  }

  private filterEligibleStores(order: Order, stores: Store[]): Store[] {
    switch (order.fulfillmentType) {
      case 'pickup':
        return stores.filter(s => s.canPickupInStore);
      case 'local_delivery':
        return stores.filter(s => s.localDeliveryEnabled);
      case 'shipping':
      default:
        return stores.filter(s => s.canFulfillOnline);
    }
  }

  private async checkInventoryAtStores(order: Order, stores: Store[]): Promise<Store[]> {
    const result: Store[] = [];
    for (const store of stores) {
      const hasInventory = await this.storeHasAllItems(store.storeId, order.items);
      if (hasInventory) {
        result.push(store);
      }
    }
    return result;
  }

  private rankStores(order: Order, stores: Store[]): Array<Store & { distance: number }> {
    return stores
      .map(store => ({
        ...store,
        distance: order.customerLocation ? this.calculateDistance(order.customerLocation, store) : Infinity,
      }))
      .sort((a, b) => {
        // Priority first
        if (a.priority !== b.priority) {
          return (a.priority || 99) - (b.priority || 99);
        }
        // Then distance
        return a.distance - b.distance;
      });
  }

  private async storeHasAllItems(storeId: string, items: Order['items']): Promise<boolean> {
    for (const item of items) {
      const available = await this.inventoryRepository.getAvailableQuantity(storeId, item.productId, item.variantId);
      if (available < item.quantity) {
        return false;
      }
    }
    return true;
  }

  private async calculateInventoryScore(storeId: string, items: Order['items']): Promise<number> {
    let fulfilledItems = 0;
    for (const item of items) {
      const available = await this.inventoryRepository.getAvailableQuantity(storeId, item.productId, item.variantId);
      if (available >= item.quantity) {
        fulfilledItems++;
      }
    }
    return (fulfilledItems / items.length) * 100;
  }

  private calculateDistance(location: CustomerLocation, store: Store): number {
    if (!location.latitude || !location.longitude || !store.latitude || !store.longitude) {
      return Infinity;
    }
    // Haversine formula for accurate distance
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(store.latitude - location.latitude);
    const dLon = this.toRad(store.longitude - location.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(location.latitude)) * Math.cos(this.toRad(store.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private getRoutingReason(order: Order, store: Store & { distance?: number }): string {
    if (order.fulfillmentType === 'pickup') {
      return store.distance !== undefined
        ? `Selected as nearest pickup location (${store.distance.toFixed(1)} km)`
        : 'Selected pickup location';
    }
    if (order.fulfillmentType === 'local_delivery') {
      return 'Within local delivery zone';
    }
    return 'Optimal fulfillment location';
  }
}
