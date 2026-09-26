/**
 * Release Location Reservation Use Case
 *
 * Location-level reservation release: validates input, checks the
 * location exists, releases the quantity, and emits inventory.released.
 * Distinct from ReleaseReservationUseCase, which releases by reservation ID.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { InventoryLocationNotFoundError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

export type LocationStockRecord = Record<string, unknown>;

export interface ReleaseLocationReservationPort {
  findLocationById(inventoryLocationId: string): Promise<LocationStockRecord | null>;
  releaseReservation(inventoryLocationId: string, quantity: number): Promise<LocationStockRecord>;
}

export class ReleaseLocationReservationUseCase {
  constructor(private readonly locations: ReleaseLocationReservationPort) {}

  async execute(inventoryLocationId: string, quantity: number | undefined): Promise<LocationStockRecord> {
    if (!quantity || quantity <= 0) {
      throw new InventoryValidationError('quantity must be a positive number');
    }

    const currentLocation = await this.locations.findLocationById(inventoryLocationId);
    if (!currentLocation) {
      throw new InventoryLocationNotFoundError(inventoryLocationId);
    }

    const updatedLocation = await this.locations.releaseReservation(inventoryLocationId, quantity);

    eventBus.emit('inventory.released', {
      inventoryLocationId,
      quantity,
    });

    return updatedLocation;
  }
}
