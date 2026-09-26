import { AppError } from '../../../../libs/errors';

export class CheckoutSessionNotFoundError extends AppError {
  constructor(sessionId: string) {
    super(`Checkout session not found: ${sessionId}`, 404, { code: 'checkout.session_not_found' });
  }
}

export class CheckoutSessionExpiredError extends AppError {
  constructor(sessionId: string) {
    super(`Checkout session ${sessionId} has expired`, 400, { code: 'checkout.session_expired' });
  }
}

export class CheckoutAlreadyCompletedError extends AppError {
  constructor(sessionId: string) {
    super(`Checkout session ${sessionId} is already completed`, 400, { code: 'checkout.already_completed' });
  }
}

export class InvalidCheckoutStateError extends AppError {
  constructor(state: string) {
    super(`Invalid checkout state: ${state}`, 400, { code: 'checkout.invalid_state' });
  }
}

export class PaymentIntentNotFoundError extends AppError {
  constructor(intentId: string) {
    super(`Payment intent not found: ${intentId}`, 404, { code: 'checkout.payment_intent_not_found' });
  }
}

export class CheckoutValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'checkout.validation_error' });
  }
}

export class CheckoutBasketNotFoundError extends AppError {
  constructor(basketId: string) {
    super(`Basket not found: ${basketId}`, 404, { code: 'checkout.basket_not_found' });
  }
}

export class PickupLocationNotFoundError extends AppError {
  constructor(locationId: string) {
    super(`Pickup location not found or inactive: ${locationId}`, 404, { code: 'checkout.pickup_location_not_found' });
  }
}
