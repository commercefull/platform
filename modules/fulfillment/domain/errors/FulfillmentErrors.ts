import { AppError } from '../../../../libs/errors';

export class FulfillmentNotFoundError extends AppError {
  constructor(fulfillmentId: string) {
    super(`Fulfillment not found: ${fulfillmentId}`, 404, { code: 'fulfillment.not_found' });
  }
}

export class FulfillmentItemNotFoundError extends AppError {
  constructor(itemId: string) {
    super(`Fulfillment item not found: ${itemId}`, 404, { code: 'fulfillment.item_not_found' });
  }
}

export class InvalidFulfillmentStatusError extends AppError {
  constructor(status: string) {
    super(`Invalid fulfillment status: ${status}`, 400, { code: 'fulfillment.invalid_status' });
  }
}

export class FulfillmentCannotBeCancelledError extends AppError {
  constructor(status: string) {
    super(`Fulfillment cannot be cancelled in status: ${status}`, 400, { code: 'fulfillment.cannot_be_cancelled' });
  }
}

export class FulfillmentAlreadyShippedError extends AppError {
  constructor(fulfillmentId: string) {
    super(`Fulfillment ${fulfillmentId} has already been shipped`, 400, { code: 'fulfillment.already_shipped' });
  }
}

export class FulfillmentPartnerNotFoundError extends AppError {
  constructor(partnerId: string) {
    super(`Fulfillment partner not found: ${partnerId}`, 404, { code: 'fulfillment.partner_not_found' });
  }
}

export class FulfillmentLocationNotFoundError extends AppError {
  constructor(locationId: string) {
    super(`Fulfillment location not found: ${locationId}`, 404, { code: 'fulfillment.location_not_found' });
  }
}

export class FailedToCreateFulfillmentError extends AppError {
  constructor() {
    super('Failed to create fulfillment', 500, { code: 'fulfillment.creation_failed' });
  }
}

export class FailedToCreateFulfillmentItemError extends AppError {
  constructor() {
    super('Failed to create fulfillment item', 500, { code: 'fulfillment.item_creation_failed' });
  }
}

export class FulfillmentValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'fulfillment.validation_error' });
  }
}

export class TrackingNumberRequiredError extends AppError {
  constructor() {
    super('Tracking number is required to ship fulfillment', 400, { code: 'fulfillment.tracking_number_required' });
  }
}

export class FailedToCreateFulfillmentLocationError extends AppError {
  constructor() {
    super('Failed to create fulfillment location', 500, { code: 'fulfillment.location_creation_failed' });
  }
}
