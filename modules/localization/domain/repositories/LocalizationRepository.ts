/**
 * Localization Repository Port
 *
 * Domain interface for localization data access (locales, countries, currencies, languages, translations).
 */

import type { LocaleRecord as Locale, Country, Currency, Language } from '../entities/LocalizationModel';


export type LocaleCreateParams = Omit<Locale, 'localeId' | 'createdAt' | 'updatedAt'>;
export type LocaleUpdateParams = Partial<Omit<Locale, 'localeId' | 'code' | 'createdAt' | 'updatedAt'>>;
export type CountryCreateParams = Omit<Country, 'countryId' | 'createdAt' | 'updatedAt'>;
export type CountryUpdateParams = Partial<Omit<Country, 'countryId' | 'code' | 'createdAt' | 'updatedAt'>>;


export interface LanguageRepositoryPort {
  listLanguages(): Promise<Language[]>;
  findLanguageById(languageId: string): Promise<Language | null>;
  createLanguage(params: { code: string; name: string; nativeName?: string; isDefault?: boolean; isActive?: boolean }): Promise<string>;
  updateLanguage(
    languageId: string,
    updates: { name?: string; nativeName?: string; isDefault?: boolean; isActive?: boolean },
  ): Promise<void>;
  deleteLanguage(languageId: string): Promise<void>;
}

export interface CurrencyRepositoryPort {
  listCurrencies(): Promise<Currency[]>;
  listActiveCurrencyCodes(): Promise<{ code: string; name: string }[]>;
  findCurrencyById(currencyId: string): Promise<Currency | null>;
  createCurrency(params: {
    code: string;
    name: string;
    symbol?: string;
    exchangeRate?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<string>;
  updateCurrency(
    currencyId: string,
    updates: { name?: string; symbol?: string; exchangeRate?: number; isDefault?: boolean; isActive?: boolean },
  ): Promise<void>;
  deleteCurrency(currencyId: string): Promise<void>;
}

export interface CountryRepositoryPort {
  findAll(activeOnly?: boolean): Promise<Country[]>;
}
