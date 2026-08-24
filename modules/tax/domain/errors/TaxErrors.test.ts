import {
  TaxClassNotFoundError, TaxRateNotFoundError, TaxRateAlreadyExistsError, TaxZoneNotFoundError,
  InvalidTaxRateError, FailedToCalculateTaxError, TaxValidationError, FailedToCreateTaxError,
  TaxCategoryNotFoundError, TaxExemptionNotFoundError, TaxSettingsNotFoundError,
} from './TaxErrors';

describe('TaxErrors', () => {
  it('TaxClassNotFoundError', () => { expect(new TaxClassNotFoundError('c1').statusCode).toBe(404); });
  it('TaxRateNotFoundError', () => { expect(new TaxRateNotFoundError('r1').statusCode).toBe(404); });
  it('TaxRateAlreadyExistsError', () => { expect(new TaxRateAlreadyExistsError('zone1', 'class1').statusCode).toBe(409); });
  it('TaxZoneNotFoundError', () => { expect(new TaxZoneNotFoundError('z1').statusCode).toBe(404); });
  it('InvalidTaxRateError', () => { expect(new InvalidTaxRateError(150).statusCode).toBe(400); });
  it('FailedToCalculateTaxError', () => { expect(new FailedToCalculateTaxError('err').statusCode).toBe(500); });
  it('TaxValidationError', () => { expect(new TaxValidationError('bad').statusCode).toBe(400); });
  it('FailedToCreateTaxError', () => { expect(new FailedToCreateTaxError().statusCode).toBe(500); });
  it('TaxCategoryNotFoundError', () => { expect(new TaxCategoryNotFoundError('c1').statusCode).toBe(404); });
  it('TaxExemptionNotFoundError', () => { expect(new TaxExemptionNotFoundError('e1').statusCode).toBe(404); });
  it('TaxSettingsNotFoundError', () => { expect(new TaxSettingsNotFoundError('s1').statusCode).toBe(404); });
});
