/**
 * Reserve Location Stock Use Case
 *
 * Location-level quantity reservation: validates input, checks the
 * location exists, applies the reservation, and emits inventory.reserved.
 * Distinct from ReserveStockUseCase, which reserves per order line items.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { InventoryLocationNotFoundError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

export type LocationStockRecord = Record<string, unknown>;

export interface LocationReservationPort {
  findLocationById(inventoryLocationId: string): Promise<LocationStockRecord | null>;
  reserveQuantity(inventoryLocationId: string, quantity: number): Promise<LocationStockRecord>;
}

export interface ReserveLocationStockCommand {
  inventoryLocationId: string;
  quantity?: number;
  orderId?: string;
  basketId?: string;
}

export class ReserveLocationStockUseCase {
  constructor(private readonly locations: LocationReservationPort) {}

  async execute(command: ReserveLocationStockCommand): Promise<LocationStockRecord> {
    const quantity = command.quantity ?? 0;
    if (!quantity || quantity <= 0) {
      throw new InventoryValidationError('quantity must be a positive number');
    }

    const currentLocation = await this.locations.findLocationById(command.inventoryLocationId);
    if (!currentLocation) {
      throw new InventoryLocationNotFoundError(command.inventoryLocationId);
    }

    const updatedLocation = await this.locations.reserveQuantity(command.inventoryLocationId, quantity);

    eventBus.emit('inventory.reserved', {
      inventoryLocationId: command.inventoryLocationId,
      quantity,
      orderId: command.orderId,
      basketId: command.basketId,
    });

    return updatedLocation;
  }
}
