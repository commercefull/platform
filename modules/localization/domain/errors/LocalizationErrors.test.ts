import {
  LocaleNotFoundError, LocaleCodeAlreadyExistsError, CountryNotFoundError, CountryCodeAlreadyExistsError,
  CurrencyNotFoundError, CurrencyCodeAlreadyExistsError, LanguageNotFoundError, LanguageCodeAlreadyExistsError,
  TranslationNotFoundError, InvalidExchangeRateError, LocalizationValidationError,
  FailedToCreateCountryError, FailedToCreateLocaleError,
} from './LocalizationErrors';

describe('LocalizationErrors', () => {
  it('LocaleNotFoundError', () => { expect(new LocaleNotFoundError('l1').statusCode).toBe(404); });
  it('LocaleCodeAlreadyExistsError', () => { expect(new LocaleCodeAlreadyExistsError('en').statusCode).toBe(409); });
  it('CountryNotFoundError', () => { expect(new CountryNotFoundError('c1').statusCode).toBe(404); });
  it('CountryCodeAlreadyExistsError', () => { expect(new CountryCodeAlreadyExistsError('US').statusCode).toBe(409); });
  it('CurrencyNotFoundError', () => { expect(new CurrencyNotFoundError('USD').statusCode).toBe(404); });
  it('CurrencyCodeAlreadyExistsError', () => { expect(new CurrencyCodeAlreadyExistsError('USD').statusCode).toBe(409); });
  it('LanguageNotFoundError', () => { expect(new LanguageNotFoundError('en').statusCode).toBe(404); });
  it('LanguageCodeAlreadyExistsError', () => { expect(new LanguageCodeAlreadyExistsError('en').statusCode).toBe(409); });
  it('TranslationNotFoundError', () => { expect(new TranslationNotFoundError('t1').statusCode).toBe(404); });
  it('InvalidExchangeRateError', () => { expect(new InvalidExchangeRateError('bad').statusCode).toBe(400); });
  it('LocalizationValidationError', () => { expect(new LocalizationValidationError('bad').statusCode).toBe(400); });
  it('FailedToCreateCountryError', () => { expect(new FailedToCreateCountryError().statusCode).toBe(500); });
  it('FailedToCreateLocaleError', () => { expect(new FailedToCreateLocaleError().statusCode).toBe(500); });
});
