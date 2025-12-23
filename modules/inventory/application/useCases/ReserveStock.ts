/**
 * ReserveStock Use Case
 * 
 * Reserves inventory for an order, preventing overselling.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ReserveStockItemInput {
  productId: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  locationId?: string; // warehouse or store
}

export interface ReserveStockInput {
  orderId: string;
  items: ReserveStockItemInput[];
  expiresAt?: Date; // When reservation expires
  channelId?: string;
  storeId?: string;
}

export interface ReservationResult {
  productId: string;
  variantId?: string;
  sku?: string;
  requestedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isFullyReserved: boolean;
  locationId?: string;
}

export interface ReserveStockOutput {
  reservationId: string;
  orderId: string;
  results: ReservationResult[];
  allReserved: boolean;
  expiresAt: string;
}

export class ReserveStockUseCase {
  constructor(
    private readonly inventoryRepository: any // InventoryRepository
  ) {}

  async execute(input: ReserveStockInput): Promise<ReserveStockOutput> {
    const reservationId = this.generateReservationId();
    const results: ReservationResult[] = [];
    let allReserved = true;

    // Default expiration: 30 minutes
    const expiresAt = input.expiresAt || new Date(Date.now() + 30 * 60 * 1000);

    for (const item of input.items) {
      // Get current inventory level
      const inventory = await this.inventoryRepository.findByProduct(
        item.productId,
        item.variantId,
        item.locationId
      );

      if (!inventory) {
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          requestedQuantity: item.quantity,
          reservedQuantity: 0,
          availableQuantity: 0,
          isFullyReserved: false,
          locationId: item.locationId,
        });
        allReserved = false;
        continue;
      }

      // Calculate available quantity (total - already reserved)
      const availableQuantity = inventory.quantity - (inventory.reservedQuantity || 0);
      const reserveQuantity = Math.min(item.quantity, availableQuantity);

      if (reserveQuantity > 0) {
        // Create reservation record
        await this.inventoryRepository.createReservation({
          reservationId,
          orderId: input.orderId,
          inventoryItemId: inventory.inventoryItemId,
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          quantity: reserveQuantity,
          locationId: item.locationId,
          expiresAt,
          status: 'active',
        });

        // Update reserved quantity on inventory
        await this.inventoryRepository.updateReservedQuantity(
          inventory.inventoryItemId,
          (inventory.reservedQuantity || 0) + reserveQuantity
        );
      }

      const isFullyReserved = reserveQuantity >= item.quantity;
      if (!isFullyReserved) {
        allReserved = false;
      }

      results.push({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        requestedQuantity: item.quantity,
        reservedQuantity: reserveQuantity,
        availableQuantity,
        isFullyReserved,
        locationId: item.locationId,
      });
    }

    // Emit event
    eventBus.emit('inventory.reserved', {
      reservationId,
      orderId: input.orderId,
      itemCount: input.items.length,
      allReserved,
    });

    return {
      reservationId,
      orderId: input.orderId,
      results,
      allReserved,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private generateReservationId(): string {
    return `res_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
