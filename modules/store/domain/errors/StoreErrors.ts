import { AppError } from '../../../../libs/errors';

export class StoreNotFoundError extends AppError {
  constructor(storeId: string) {
    super(`Store not found: ${storeId}`, 404, { code: 'store.not_found' });
  }
}

export class StoreSlugAlreadyExistsError extends AppError {
  constructor(slug: string) {
    super(`Store slug already exists: ${slug}`, 409, { code: 'store.slug_already_exists' });
  }
}

export class StoreNotActiveError extends AppError {
  constructor(storeId: string) {
    super(`Store ${storeId} is not active`, 400, { code: 'store.not_active' });
  }
}

export class StoreHierarchyNotFoundError extends AppError {
  constructor(hierarchyId: string) {
    super(`Store hierarchy not found: ${hierarchyId}`, 404, { code: 'store.hierarchy_not_found' });
  }
}

export class PickupConfigNotFoundError extends AppError {
  constructor(storeId: string) {
    super(`Pickup configuration not found for store: ${storeId}`, 404, { code: 'store.pickup_config_not_found' });
  }
}

export class LocalDeliveryZoneNotFoundError extends AppError {
  constructor(zoneId: string) {
    super(`Local delivery zone not found: ${zoneId}`, 404, { code: 'store.delivery_zone_not_found' });
  }
}

export class FailedToCreateStoreError extends AppError {
  constructor() {
    super('Failed to create store', 500, { code: 'store.creation_failed' });
  }
}

export class StoreValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'store.validation_error' });
  }
}
