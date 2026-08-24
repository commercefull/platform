import { AppError } from '../../../../libs/errors';

export class InventoryItemNotFoundError extends AppError {
  constructor(itemId: string) {
    super(`Inventory item not found: ${itemId}`, 404, { code: 'inventory.item_not_found' });
  }
}

export class InsufficientStockError extends AppError {
  constructor(sku: string, requested: number, available: number) {
    super(`Insufficient stock for ${sku}: requested ${requested}, available ${available}`, 400, { code: 'inventory.insufficient_stock' });
  }
}

export class InventoryLocationNotFoundError extends AppError {
  constructor(locationId: string) {
    super(`Inventory location not found: ${locationId}`, 404, { code: 'inventory.location_not_found' });
  }
}

export class StockAdjustmentFailedError extends AppError {
  constructor(reason: string) {
    super(`Stock adjustment failed: ${reason}`, 500, { code: 'inventory.adjustment_failed' });
  }
}

export class InvalidStockQuantityError extends AppError {
  constructor(quantity: number) {
    super(`Invalid stock quantity: ${quantity}`, 400, { code: 'inventory.invalid_quantity' });
  }
}

export class ReservationNotFoundError extends AppError {
  constructor(reservationId: string) {
    super(`Reservation not found: ${reservationId}`, 404, { code: 'inventory.reservation_not_found' });
  }
}

export class TransferNotFoundError extends AppError {
  constructor(transferId: string) {
    super(`Transfer not found: ${transferId}`, 404, { code: 'inventory.transfer_not_found' });
  }
}

export class CannotTransferToSameLocationError extends AppError {
  constructor() {
    super('Cannot transfer to the same location', 400, { code: 'inventory.same_location_transfer' });
  }
}

export class StoreDispatchNotFoundError extends AppError {
  constructor(dispatchId: string) {
    super(`Store dispatch not found: ${dispatchId}`, 404, { code: 'inventory.dispatch_not_found' });
  }
}

export class InventoryValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'inventory.validation_error' });
  }
}

export class FailedToCreateInventoryError extends AppError {
  constructor(message: string = 'Failed to create inventory entity') {
    super(message, 500, { code: 'inventory.creation_failed' });
  }
}
