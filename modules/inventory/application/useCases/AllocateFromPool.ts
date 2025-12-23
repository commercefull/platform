/**
 * AllocateFromPool Use Case
 * 
 * Allocates inventory from a shared pool to fulfill an order.
 */

export interface AllocateFromPoolInput {
  poolId: string;
  orderId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    preferredLocationId?: string;
  }>;
  allocationStrategy?: 'fifo' | 'nearest' | 'even_split' | 'priority';
  customerLocation?: {
    latitude: number;
    longitude: number;
    postalCode?: string;
  };
}

export interface AllocationResult {
  productId: string;
  variantId?: string;
  requestedQuantity: number;
  allocations: Array<{
    inventoryId: string;
    locationId: string;
    quantity: number;
  }>;
  shortfall: number;
}

export interface AllocateFromPoolOutput {
  allocationId: string;
  poolId: string;
  orderId: string;
  results: AllocationResult[];
  fullyAllocated: boolean;
  allocatedAt: string;
}

export class AllocateFromPoolUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: AllocateFromPoolInput): Promise<AllocateFromPoolOutput> {
    const pool = await this.inventoryRepository.findPoolById(input.poolId);
    if (!pool) {
      throw new Error(`Inventory pool not found: ${input.poolId}`);
    }

    if (!pool.isActive) {
      throw new Error('Inventory pool is not active');
    }

    const allocationId = `alloc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const strategy = input.allocationStrategy || pool.allocationStrategy;
    const results: AllocationResult[] = [];
    let fullyAllocated = true;

    for (const item of input.items) {
      const inventoryLocations = await this.inventoryRepository.findAvailableInPool(
        input.poolId,
        item.productId,
        item.variantId
      );

      // Sort by allocation strategy
      const sortedLocations = this.sortByStrategy(
        inventoryLocations,
        strategy,
        item.preferredLocationId,
        input.customerLocation
      );

      const allocations: AllocationResult['allocations'] = [];
      let remainingQuantity = item.quantity;

      for (const location of sortedLocations) {
        if (remainingQuantity <= 0) break;

        const allocateQty = Math.min(remainingQuantity, location.availableQuantity);
        
        // Reserve the stock
        await this.inventoryRepository.reserveStock(
          location.inventoryId,
          allocateQty,
          input.orderId,
          allocationId
        );

        allocations.push({
          inventoryId: location.inventoryId,
          locationId: location.locationId,
          quantity: allocateQty,
        });

        remainingQuantity -= allocateQty;
      }

      const shortfall = remainingQuantity;
      if (shortfall > 0) {
        fullyAllocated = false;
      }

      results.push({
        productId: item.productId,
        variantId: item.variantId,
        requestedQuantity: item.quantity,
        allocations,
        shortfall,
      });
    }

    // Record allocation
    await this.inventoryRepository.createAllocation({
      allocationId,
      poolId: input.poolId,
      orderId: input.orderId,
      results,
      fullyAllocated,
      strategy,
    });

    return {
      allocationId,
      poolId: input.poolId,
      orderId: input.orderId,
      results,
      fullyAllocated,
      allocatedAt: new Date().toISOString(),
    };
  }

  private sortByStrategy(
    locations: any[],
    strategy: string,
    preferredLocationId?: string,
    customerLocation?: { latitude: number; longitude: number }
  ): any[] {
    switch (strategy) {
      case 'priority':
        // Preferred location first, then by priority
        return locations.sort((a, b) => {
          if (a.locationId === preferredLocationId) return -1;
          if (b.locationId === preferredLocationId) return 1;
          return (a.priority || 0) - (b.priority || 0);
        });

      case 'nearest':
        // Sort by distance to customer if location provided
        if (customerLocation) {
          return locations.sort((a, b) => {
            const distA = this.calculateDistance(customerLocation, a);
            const distB = this.calculateDistance(customerLocation, b);
            return distA - distB;
          });
        }
        return locations;

      case 'even_split':
        // Already handled in allocation loop
        return locations;

      case 'fifo':
      default:
        // First in, first out - by creation date
        return locations.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }
  }

  private calculateDistance(
    customer: { latitude: number; longitude: number },
    location: { latitude?: number; longitude?: number }
  ): number {
    if (!location.latitude || !location.longitude) {
      return Infinity;
    }
    // Simple Euclidean distance (for proper geo would use Haversine)
    return Math.sqrt(
      Math.pow(customer.latitude - location.latitude, 2) +
      Math.pow(customer.longitude - location.longitude, 2)
    );
  }
}
