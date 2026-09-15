/**
 * Basket Domain Errors
 * Custom error classes for basket operations
 * All errors extend AppError so the error middleware maps statusCode → HTTP status.
 */

import { AppError } from '../../../../libs/errors';

export abstract class BasketError extends AppError {
  constructor(message: string, statusCode: number, code: string) {
    super(message, statusCode, { code });
  }
}

export class BasketNotFoundError extends BasketError {
  constructor(basketId: string) {
    super(`Basket with ID ${basketId} not found`, 404, 'basket.not_found');
  }
}

export class BasketItemNotFoundError extends BasketError {
  constructor(basketItemId: string) {
    super(`Item ${basketItemId} not found in basket`, 404, 'basket.item_not_found');
  }
}

export class BasketNotActiveError extends BasketError {
  constructor(basketId: string) {
    super(`Basket ${basketId} is not active`, 400, 'basket.not_active');
  }
}

export class BasketExpiredError extends BasketError {
  constructor(basketId: string) {
    super(`Basket ${basketId} has expired`, 400, 'basket.expired');
  }
}

export class InvalidExpirationDaysError extends BasketError {
  constructor(days: number) {
    super(`Days must be at least 1, got ${days}`, 400, 'basket.invalid_expiration_days');
  }
}

export class BasketValidationError extends BasketError {
  constructor(message: string) {
    super(message, 400, 'basket.validation_error');
  }
}

export class BasketAlreadyAssignedError extends BasketError {
  constructor() {
    super('Basket is already assigned to a different customer', 400, 'basket.already_assigned');
  }
}

export class CouponAlreadyAppliedError extends BasketError {
  constructor() {
    super('A coupon is already applied. Remove it first before applying a new one.', 400, 'basket.coupon_already_applied');
  }
}

export class NoCouponAppliedError extends BasketError {
  constructor() {
    super('No coupon applied to this basket', 400, 'basket.no_coupon_applied');
  }
}

export class BasketItemQuantityError extends BasketError {
  constructor(message: string) {
    super(message, 400, 'basket.item_quantity_error');
  }
}

export class BasketItemDiscountError extends BasketError {
  constructor(message: string) {
    super(message, 400, 'basket.item_discount_error');
  }
}
