import { AppError } from '../../../../libs/errors';

export class LocaleNotFoundError extends AppError {
  constructor(localeId: string) {
    super(`Locale not found: ${localeId}`, 404, { code: 'localization.locale_not_found' });
  }
}

export class LocaleCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Locale code already exists: ${code}`, 409, { code: 'localization.locale_code_already_exists' });
  }
}

export class CountryNotFoundError extends AppError {
  constructor(countryId: string) {
    super(`Country not found: ${countryId}`, 404, { code: 'localization.country_not_found' });
  }
}

export class CountryCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Country code already exists: ${code}`, 409, { code: 'localization.country_code_already_exists' });
  }
}

export class CurrencyNotFoundError extends AppError {
  constructor(currencyId: string) {
    super(`Currency not found: ${currencyId}`, 404, { code: 'localization.currency_not_found' });
  }
}

export class CurrencyCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Currency code already exists: ${code}`, 409, { code: 'localization.currency_code_already_exists' });
  }
}

export class LanguageNotFoundError extends AppError {
  constructor(languageId: string) {
    super(`Language not found: ${languageId}`, 404, { code: 'localization.language_not_found' });
  }
}

export class LanguageCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Language code already exists: ${code}`, 409, { code: 'localization.language_code_already_exists' });
  }
}

export class TranslationNotFoundError extends AppError {
  constructor(translationId: string) {
    super(`Translation not found: ${translationId}`, 404, { code: 'localization.translation_not_found' });
  }
}

export class InvalidExchangeRateError extends AppError {
  constructor(reason: string) {
    super(`Invalid exchange rate: ${reason}`, 400, { code: 'localization.invalid_exchange_rate' });
  }
}

export class LocalizationValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'localization.validation_error' });
  }
}

export class FailedToCreateCountryError extends AppError {
  constructor() {
    super('Failed to create country', 500, { code: 'localization.country_creation_failed' });
  }
}

export class FailedToCreateLocaleError extends AppError {
  constructor() {
    super('Failed to create locale', 500, { code: 'localization.locale_creation_failed' });
  }
}
