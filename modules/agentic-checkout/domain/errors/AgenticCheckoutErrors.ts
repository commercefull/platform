import { AppError } from '../../../../libs/errors';

export class ChannelSessionNotFoundError extends AppError {
  constructor(id: string) {
    super(`Channel session not found: ${id}`, 404, { code: 'agenticCheckout.session_not_found' });
  }
}

export class ChannelSessionNotMutableError extends AppError {
  constructor(id: string, status: string) {
    super(`Channel session ${id} is ${status} and cannot be modified`, 409, {
      code: 'agenticCheckout.session_not_mutable',
    });
  }
}

export class ChannelAuthenticationError extends AppError {
  constructor(message = 'Invalid or missing channel credentials') {
    super(message, 401, { code: 'agenticCheckout.unauthenticated' });
  }
}

export class ChannelSignatureError extends AppError {
  constructor(message = 'Request signature verification failed') {
    super(message, 401, { code: 'agenticCheckout.signature_invalid' });
  }
}

export class IdempotencyKeyRequiredError extends AppError {
  constructor() {
    super('Idempotency-Key header is required on POST requests', 400, {
      code: 'agenticCheckout.idempotency_key_required',
    });
  }
}

export class IdempotencyConflictError extends AppError {
  constructor() {
    super('Idempotency-Key was already used with a different request payload', 422, {
      code: 'agenticCheckout.idempotency_conflict',
    });
  }
}

export class IdempotencyInFlightError extends AppError {
  constructor() {
    super('A request with this Idempotency-Key is still being processed', 409, {
      code: 'agenticCheckout.idempotency_in_flight',
    });
  }
}

export class DelegatedPaymentError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'agenticCheckout.payment_failed' });
  }
}

export class ChannelCatalogError extends AppError {
  constructor(message: string) {
    super(message, 422, { code: 'agenticCheckout.catalog_error' });
  }
}

export class ChannelValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'agenticCheckout.validation_error' });
  }
}
