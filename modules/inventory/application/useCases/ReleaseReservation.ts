/**
 * ReleaseReservation Use Case
 *
 * Releases previously reserved inventory back to available stock.
 * Used when an order is cancelled or reservation expires.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ReleaseReservationInput {
  reservationId?: string;
  orderId?: string;
  reason?: 'cancelled' | 'expired' | 'fulfilled' | 'manual';
}

export interface ReleaseReservationOutput {
  releasedCount: number;
  items: Array<{
    productId: string;
    variantId?: string;
    releasedQuantity: number;
    locationId?: string;
  }>;
}

export class ReleaseReservationUseCase {
  constructor(
    private readonly inventoryRepository: any, // InventoryRepository
  ) {}

  async execute(input: ReleaseReservationInput): Promise<ReleaseReservationOutput> {
    if (!input.reservationId && !input.orderId) {
      throw new Error('Either reservationId or orderId must be provided');
    }

    // Find reservations to release
    let reservations: any[];
    if (input.reservationId) {
      const reservation = await this.inventoryRepository.findReservationById(input.reservationId);
      reservations = reservation ? [reservation] : [];
    } else {
      reservations = await this.inventoryRepository.findReservationsByOrderId(input.orderId!);
    }

    if (reservations.length === 0) {
      return {
        releasedCount: 0,
        items: [],
      };
    }

    const releasedItems: ReleaseReservationOutput['items'] = [];

    for (const reservation of reservations) {
      if (reservation.status !== 'active') {
        continue; // Skip already released/fulfilled reservations
      }

      // Get the inventory item
      const inventory = await this.inventoryRepository.findById(reservation.inventoryItemId);
      if (!inventory) {
        continue;
      }

      // Decrease reserved quantity
      const newReservedQuantity = Math.max(0, (inventory.reservedQuantity || 0) - reservation.quantity);
      await this.inventoryRepository.updateReservedQuantity(inventory.inventoryItemId, newReservedQuantity);

      // Update reservation status
      await this.inventoryRepository.updateReservationStatus(
        reservation.reservationId,
        input.reason === 'fulfilled' ? 'fulfilled' : 'released',
        input.reason,
      );

      releasedItems.push({
        productId: reservation.productId,
        variantId: reservation.variantId,
        releasedQuantity: reservation.quantity,
        locationId: reservation.locationId,
      });
    }

    // Emit event
    eventBus.emit('inventory.released', {
      reservationId: input.reservationId,
      orderId: input.orderId,
      releasedCount: releasedItems.length,
      reason: input.reason,
    });

    return {
      releasedCount: releasedItems.length,
      items: releasedItems,
    };
  }
}
