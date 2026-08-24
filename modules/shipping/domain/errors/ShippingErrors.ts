import { AppError } from '../../../../libs/errors';

export class ShippingCarrierNotFoundError extends AppError {
  constructor(carrierId: string) {
    super(`Shipping carrier not found: ${carrierId}`, 404, { code: 'shipping.carrier_not_found' });
  }
}

export class ShippingMethodNotFoundError extends AppError {
  constructor(methodId: string) {
    super(`Shipping method not found: ${methodId}`, 404, { code: 'shipping.method_not_found' });
  }
}

export class ShippingZoneNotFoundError extends AppError {
  constructor(zoneId: string) {
    super(`Shipping zone not found: ${zoneId}`, 404, { code: 'shipping.zone_not_found' });
  }
}

export class ShippingRateNotFoundError extends AppError {
  constructor(rateId: string) {
    super(`Shipping rate not found: ${rateId}`, 404, { code: 'shipping.rate_not_found' });
  }
}

export class PackagingTypeNotFoundError extends AppError {
  constructor(packagingId: string) {
    super(`Packaging type not found: ${packagingId}`, 404, { code: 'shipping.packaging_not_found' });
  }
}

export class FailedToCalculateRateError extends AppError {
  constructor(reason: string) {
    super(`Failed to calculate shipping rate: ${reason}`, 500, { code: 'shipping.rate_calculation_failed' });
  }
}

export class NoShippingMethodsAvailableError extends AppError {
  constructor() {
    super('No shipping methods available for this destination', 400, { code: 'shipping.no_methods_available' });
  }
}

export class ShippingValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'shipping.validation_error' });
  }
}

export class ShippingCarrierAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Shipping carrier with code '${code}' already exists`, 409, { code: 'shipping.carrier_already_exists' });
  }
}

export class FailedToCreateShippingEntityError extends AppError {
  constructor(message: string) {
    super(message, 500, { code: 'shipping.entity_creation_failed' });
  }
}
