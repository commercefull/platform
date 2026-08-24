/**
 * Localization Repository Port
 *
 * Domain interface for localization data access (locales, countries, currencies, languages, translations).
 */

import type { Locale, Country, Currency, Language } from 'libs/db/types';
import type { TranslatableEntityType } from '../entities/Translation';

export type LocaleCreateParams = Omit<Locale, 'localeId' | 'createdAt' | 'updatedAt'>;
export type LocaleUpdateParams = Partial<Omit<Locale, 'localeId' | 'code' | 'createdAt' | 'updatedAt'>>;
export type CountryCreateParams = Omit<Country, 'countryId' | 'createdAt' | 'updatedAt'>;
export type CountryUpdateParams = Partial<Omit<Country, 'countryId' | 'code' | 'createdAt' | 'updatedAt'>>;
export type TextDirection = 'ltr' | 'rtl';

export interface LocalizationRepository {
  // Locales
  findLocaleById(localeId: string): Promise<Locale | null>;
  findLocaleByCode(code: string): Promise<Locale | null>;
  findDefaultLocale(): Promise<Locale | null>;
  findAllLocales(activeOnly?: boolean): Promise<Locale[]>;
  findLocalesByLanguage(language: string, activeOnly?: boolean): Promise<Locale[]>;
  findLocalesByCountryCode(countryCode: string, activeOnly?: boolean): Promise<Locale[]>;
  findLocalesByCurrency(currencyId: string, activeOnly?: boolean): Promise<Locale[]>;
  findLocalesByTextDirection(textDirection: TextDirection, activeOnly?: boolean): Promise<Locale[]>;
  searchLocales(searchTerm: string, activeOnly?: boolean): Promise<Locale[]>;
  createLocale(params: LocaleCreateParams): Promise<Locale>;
  updateLocale(localeId: string, params: LocaleUpdateParams): Promise<Locale | null>;
  setLocaleAsDefault(localeId: string): Promise<Locale | null>;
  activateLocale(localeId: string): Promise<Locale | null>;
  deactivateLocale(localeId: string): Promise<Locale | null>;
  deleteLocale(localeId: string): Promise<boolean>;

  // Countries
  findCountryById(countryId: string): Promise<Country | null>;
  findCountryByCode(code: string): Promise<Country | null>;
  findCountryByAlpha3Code(alpha3Code: string): Promise<Country | null>;
  findAllCountries(activeOnly?: boolean): Promise<Country[]>;
  findCountriesByRegion(region: string, activeOnly?: boolean): Promise<Country[]>;
  searchCountries(searchTerm: string, activeOnly?: boolean): Promise<Country[]>;
  createCountry(params: CountryCreateParams): Promise<Country>;
  updateCountry(countryId: string, params: CountryUpdateParams): Promise<Country | null>;
  deleteCountry(countryId: string): Promise<boolean>;

  // Currencies
  listCurrencies(): Promise<Currency[]>;
  findCurrencyById(currencyId: string): Promise<Currency | null>;
  createCurrency(params: { code: string; name: string; symbol?: string; exchangeRate?: number; isDefault?: boolean; isActive?: boolean }): Promise<string>;
  updateCurrency(currencyId: string, updates: { name?: string; symbol?: string; exchangeRate?: number; isDefault?: boolean; isActive?: boolean }): Promise<void>;
  deleteCurrency(currencyId: string): Promise<void>;

  // Languages
  listLanguages(): Promise<Language[]>;
  findLanguageById(languageId: string): Promise<Language | null>;
  createLanguage(params: { code: string; name: string; nativeName?: string; isDefault?: boolean; isActive?: boolean }): Promise<string>;
  updateLanguage(languageId: string, updates: { name?: string; nativeName?: string; isDefault?: boolean; isActive?: boolean }): Promise<void>;
  deleteLanguage(languageId: string): Promise<void>;

  // Translations
  getProductTranslation(productId: string, localeId: string): Promise<Record<string, unknown> | null>;
  getProductTranslations(productId: string): Promise<Record<string, unknown>[]>;
  saveProductTranslation(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteProductTranslation(productId: string, localeId: string): Promise<void>;
  approveProductTranslation(productId: string, localeId: string, reviewerId: string): Promise<void>;
  getCategoryTranslation(categoryId: string, localeId: string): Promise<Record<string, unknown> | null>;
  getCategoryTranslations(categoryId: string): Promise<Record<string, unknown>[]>;
  saveCategoryTranslation(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  getEntityTranslations(entityType: TranslatableEntityType, entityId: string): Promise<Record<string, unknown>[]>;
  getEntityTranslation(entityType: TranslatableEntityType, entityId: string, localeId: string): Promise<Record<string, unknown> | null>;
  getMissingTranslations(entityType: TranslatableEntityType, entityId: string): Promise<Record<string, unknown>[]>;
  getTranslationStatistics(): Promise<{ entityType: string; total: number; approved: number; autoTranslated: number; pending: number }[]>;
  bulkApproveTranslations(entityType: TranslatableEntityType, translationIds: string[], reviewerId: string): Promise<number>;
}
