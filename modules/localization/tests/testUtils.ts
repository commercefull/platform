/**
 * Shared test utilities for localization unit tests.
 *
 * Localization ports return knex row types (anemic domain), so factories
 * return typed object literals; only the ports are mocked.
 */

import type { Currency, Language, Country } from '../../../libs/db/types';
import type {
  LanguageRepositoryPort,
  CurrencyRepositoryPort,
  CountryRepositoryPort,
} from '../domain/repositories/LocalizationRepository';
import type { ConvertCurrencyRepository } from '../application/useCases/ConvertCurrency';
import type { CreateCurrencyRepository, CreatedCurrency } from '../application/useCases/CreateCurrency';
import type { CreateLocaleRepository, CreatedLocale } from '../application/useCases/CreateLocale';
import type { SetExchangeRateRepository } from '../application/useCases/SetExchangeRate';

export function createCurrency(overrides: Partial<Currency> = {}): Currency {
  return {
    currencyId: 'cur-1',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'before',
    exchangeRate: 1,
    isActive: true,
    isDefault: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as Currency;
}


export function createCountry(overrides: Partial<Country> = {}): Country {
  return {
    countryId: 'country-1',
    code: 'US',
    name: 'United States',
    numericCode: 840,
    alpha3Code: 'USA',
    defaultCurrencyId: 'cur-1',
    isActive: true,
    flagIcon: null,
    region: 'Americas',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createCreatedCurrency(overrides: Partial<CreatedCurrency> = {}): CreatedCurrency {
  return {
    currencyId: 'cur-1',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    exchangeRate: 1,
    isDefault: true,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createCreatedLocale(overrides: Partial<CreatedLocale> = {}): CreatedLocale {
  return {
    localeId: 'loc-1',
    code: 'en-US',
    name: 'English (US)',
    isDefault: true,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createConvertCurrencyRepository(): jest.Mocked<ConvertCurrencyRepository> {
  const repository: jest.Mocked<ConvertCurrencyRepository> = {
    findCurrencyByCode: jest.fn(),
  };
  repository.findCurrencyByCode.mockResolvedValue(null);
  return repository;
}

export function createCreateCurrencyRepository(existing: CreatedCurrency | null = null): jest.Mocked<CreateCurrencyRepository> {
  const repository: jest.Mocked<CreateCurrencyRepository> = {
    findCurrencyByCode: jest.fn(),
    createCurrency: jest.fn(),
  };
  repository.findCurrencyByCode.mockResolvedValue(existing);
  repository.createCurrency.mockImplementation(data =>
    Promise.resolve(
      createCreatedCurrency({ currencyId: data.currencyId, code: data.code, name: data.name, symbol: data.symbol, exchangeRate: data.exchangeRate, isDefault: data.isDefault }),
    ),
  );
  return repository;
}

export function createCreateLocaleRepository(existing: CreatedLocale | null = null): jest.Mocked<CreateLocaleRepository> {
  const repository: jest.Mocked<CreateLocaleRepository> = {
    findLocaleByCode: jest.fn(),
    createLocale: jest.fn(),
  };
  repository.findLocaleByCode.mockResolvedValue(existing);
  repository.createLocale.mockImplementation(data =>
    Promise.resolve(
      createCreatedLocale({ localeId: data.localeId, code: data.code, name: data.name, isDefault: data.isDefault, isActive: data.isActive }),
    ),
  );
  return repository;
}

export function createSetExchangeRateRepository(currency: { currencyId: string; exchangeRate: number } | null = null): jest.Mocked<SetExchangeRateRepository> {
  const repository: jest.Mocked<SetExchangeRateRepository> = {
    findCurrencyByCode: jest.fn(),
    updateCurrency: jest.fn(),
    createExchangeRateHistory: jest.fn(),
  };
  repository.findCurrencyByCode.mockResolvedValue(currency);
  repository.updateCurrency.mockResolvedValue(undefined);
  repository.createExchangeRateHistory.mockResolvedValue(undefined);
  return repository;
}

function createLanguage(overrides: Partial<Language> = {}): Language {
  return {
    languageId: 'lang-1',
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isDefault: true,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createLanguageRepository(): jest.Mocked<LanguageRepositoryPort> {
  const repository: jest.Mocked<LanguageRepositoryPort> = {
    listLanguages: jest.fn(),
    findLanguageById: jest.fn(),
    createLanguage: jest.fn(),
    updateLanguage: jest.fn(),
    deleteLanguage: jest.fn(),
  };
  repository.listLanguages.mockResolvedValue([createLanguage()]);
  repository.findLanguageById.mockResolvedValue(createLanguage());
  repository.createLanguage.mockResolvedValue('lang-2');
  repository.updateLanguage.mockResolvedValue(undefined);
  repository.deleteLanguage.mockResolvedValue(undefined);
  return repository;
}

export function createCurrencyRepository(): jest.Mocked<CurrencyRepositoryPort> {
  const repository: jest.Mocked<CurrencyRepositoryPort> = {
    listCurrencies: jest.fn(),
    listActiveCurrencyCodes: jest.fn(),
    findCurrencyById: jest.fn(),
    createCurrency: jest.fn(),
    updateCurrency: jest.fn(),
    deleteCurrency: jest.fn(),
  };
  repository.listCurrencies.mockResolvedValue([createCurrency()]);
  repository.listActiveCurrencyCodes.mockResolvedValue([{ code: 'USD', name: 'US Dollar' }]);
  repository.findCurrencyById.mockResolvedValue(createCurrency());
  repository.createCurrency.mockResolvedValue('cur-2');
  repository.updateCurrency.mockResolvedValue(undefined);
  repository.deleteCurrency.mockResolvedValue(undefined);
  return repository;
}

export function createCountryRepository(): jest.Mocked<CountryRepositoryPort> {
  const repository: jest.Mocked<CountryRepositoryPort> = {
    findAll: jest.fn(),
  };
  repository.findAll.mockResolvedValue([createCountry()]);
  return repository;
}
