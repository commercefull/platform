import { AppError } from '../../../../libs/errors';

export class WarehouseNotFoundError extends AppError {
  constructor(warehouseId: string) {
    super(`Warehouse not found: ${warehouseId}`, 404, { code: 'warehouse.not_found' });
  }
}

export class WarehouseCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Warehouse code already exists: ${code}`, 409, { code: 'warehouse.code_already_exists' });
  }
}

export class WarehouseNotActiveError extends AppError {
  constructor(warehouseId: string) {
    super(`Warehouse ${warehouseId} is not active`, 400, { code: 'warehouse.not_active' });
  }
}

export class BinNotFoundError extends AppError {
  constructor(binId: string) {
    super(`Bin not found: ${binId}`, 404, { code: 'warehouse.bin_not_found' });
  }
}

export class ZoneNotFoundError extends AppError {
  constructor(zoneId: string) {
    super(`Warehouse zone not found: ${zoneId}`, 404, { code: 'warehouse.zone_not_found' });
  }
}

export class ReceivingRecordNotFoundError extends AppError {
  constructor(recordId: string) {
    super(`Receiving record not found: ${recordId}`, 404, { code: 'warehouse.receiving_not_found' });
  }
}

export class PickPackRecordNotFoundError extends AppError {
  constructor(recordId: string) {
    super(`Pick-pack record not found: ${recordId}`, 404, { code: 'warehouse.pick_pack_not_found' });
  }
}

export class FailedToCreateWarehouseError extends AppError {
  constructor() {
    super('Failed to create warehouse', 500, { code: 'warehouse.creation_failed' });
  }
}

export class WarehouseValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'warehouse.validation_error' });
  }
}

export class FailedToCreateWarehouseEntityError extends AppError {
  constructor(message: string) {
    super(message, 500, { code: 'warehouse.entity_creation_failed' });
  }
}
