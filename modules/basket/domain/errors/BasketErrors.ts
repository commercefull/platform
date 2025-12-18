/**
 * Basket Domain Errors
 * Custom error classes for basket operations
 */

export abstract class BasketError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BasketNotFoundError extends BasketError {
  readonly statusCode = 404;

  constructor(basketId: string) {
    super(`Basket with ID ${basketId} not found`);
  }
}

export class BasketItemNotFoundError extends BasketError {
  readonly statusCode = 404;

  constructor(basketItemId: string) {
    super(`Item ${basketItemId} not found in basket`);
  }
}

export class BasketNotActiveError extends BasketError {
  readonly statusCode = 400;

  constructor(basketId: string) {
    super(`Basket ${basketId} is not active`);
  }
}

export class BasketExpiredError extends BasketError {
  readonly statusCode = 400;

  constructor(basketId: string) {
    super(`Basket ${basketId} has expired`);
  }
}

export class InvalidExpirationDaysError extends BasketError {
  readonly statusCode = 400;

  constructor(days: number) {
    super(`Days must be at least 1, got ${days}`);
  }
}
