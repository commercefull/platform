import {
  PriceListNotFoundError, PriceNotFoundError, PriceAlreadyExistsError, InvalidPriceError,
  PriceMustBePositiveError, FailedToSetProductPriceError, FailedToCreatePricingError,
  PricingRuleNotFoundError, CurrencyNotFoundError, CurrencyRegionNotFoundError,
  CurrencyRegionAlreadyExistsError, PricingValidationError,
} from './PricingErrors';

describe('PricingErrors', () => {
  it('PriceListNotFoundError', () => { expect(new PriceListNotFoundError('pl1').statusCode).toBe(404); });
  it('PriceNotFoundError', () => { expect(new PriceNotFoundError('p1').statusCode).toBe(404); });
  it('PriceAlreadyExistsError', () => { expect(new PriceAlreadyExistsError('prod1', 'pl1').statusCode).toBe(409); });
  it('InvalidPriceError', () => { expect(new InvalidPriceError('negative').statusCode).toBe(400); });
  it('PriceMustBePositiveError', () => { expect(new PriceMustBePositiveError().statusCode).toBe(400); });
  it('FailedToSetProductPriceError', () => { expect(new FailedToSetProductPriceError().statusCode).toBe(500); });
  it('FailedToCreatePricingError', () => { expect(new FailedToCreatePricingError().statusCode).toBe(500); });
  it('PricingRuleNotFoundError', () => { expect(new PricingRuleNotFoundError('r1').statusCode).toBe(404); });
  it('CurrencyNotFoundError', () => { expect(new CurrencyNotFoundError('USD').statusCode).toBe(404); });
  it('CurrencyRegionNotFoundError', () => { expect(new CurrencyRegionNotFoundError('r1').statusCode).toBe(404); });
  it('CurrencyRegionAlreadyExistsError', () => { expect(new CurrencyRegionAlreadyExistsError('US').statusCode).toBe(409); });
  it('PricingValidationError', () => { expect(new PricingValidationError('bad').statusCode).toBe(400); });
});
