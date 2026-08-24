import { AppError } from '../../../../libs/errors';

export class PriceListNotFoundError extends AppError {
  constructor(priceListId: string) {
    super(`Price list not found: ${priceListId}`, 404, { code: 'pricing.price_list_not_found' });
  }
}

export class PriceNotFoundError extends AppError {
  constructor(priceId: string) {
    super(`Price not found: ${priceId}`, 404, { code: 'pricing.price_not_found' });
  }
}

export class PriceAlreadyExistsError extends AppError {
  constructor(productId: string, priceListId: string) {
    super(`Price already exists for product ${productId} in price list ${priceListId}`, 409, { code: 'pricing.price_already_exists' });
  }
}

export class InvalidPriceError extends AppError {
  constructor(reason: string) {
    super(`Invalid price: ${reason}`, 400, { code: 'pricing.invalid_price' });
  }
}

export class PriceMustBePositiveError extends AppError {
  constructor() {
    super('Price must be greater than or equal to zero', 400, { code: 'pricing.price_must_be_positive' });
  }
}

export class FailedToSetProductPriceError extends AppError {
  constructor() {
    super('Failed to set product price', 500, { code: 'pricing.set_price_failed' });
  }
}

export class FailedToCreatePricingError extends AppError {
  constructor(message: string = 'Failed to create pricing entity') {
    super(message, 500, { code: 'pricing.creation_failed' });
  }
}

export class PricingRuleNotFoundError extends AppError {
  constructor(ruleId: string) {
    super(`Pricing rule not found: ${ruleId}`, 404, { code: 'pricing.rule_not_found' });
  }
}

export class CurrencyNotFoundError extends AppError {
  constructor(currencyCode: string) {
    super(`Currency not found: ${currencyCode}`, 404, { code: 'pricing.currency_not_found' });
  }
}

export class CurrencyRegionNotFoundError extends AppError {
  constructor(regionId: string) {
    super(`Currency region not found: ${regionId}`, 404, { code: 'pricing.currency_region_not_found' });
  }
}

export class CurrencyRegionAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Currency region with code ${code} already exists`, 409, { code: 'pricing.currency_region_already_exists' });
  }
}

export class PricingValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'pricing.validation_error' });
  }
}
