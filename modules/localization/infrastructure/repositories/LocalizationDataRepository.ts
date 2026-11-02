/**
 * Consolidated Localization Data Repository
 *
 * Merges countryRepo, currencyRepo, languageRepo, localeRepo, translationRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Localization (countries, currencies, languages, locales, translations)
 */

import countryRepo from './countryRepo';
import {
  listCurrencies,
  listActiveCurrencyCodes,
  findCurrencyById,
  createCurrency,
  updateCurrency,
  createExchangeRateHistory,
  deleteCurrency,
} from './currencyRepo';
import {
  listLanguages,
  findLanguageById,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from './languageRepo';
import localeRepo from './localeRepo';
import {
  getProductTranslation,
  getProductTranslations,
  saveProductTranslation,
  deleteProductTranslation,
  approveProductTranslation,
  getCategoryTranslation,
  getCategoryTranslations,
  saveCategoryTranslation,
  getEntityTranslations,
  getEntityTranslation,
  getMissingTranslations,
  getTranslationStatistics,
  bulkApproveTranslations,
} from './translationRepo';

// Re-export types for backward compatibility
export type { CountryCreateParams, CountryUpdateParams } from './countryRepo';

const currencyRepo = {
  listCurrencies,
  listActiveCurrencyCodes,
  findCurrencyById,
  createCurrency,
  updateCurrency,
  createExchangeRateHistory,
  deleteCurrency,
};

const languageRepo = {
  listLanguages,
  findLanguageById,
  createLanguage,
  updateLanguage,
  deleteLanguage,
};

const translationRepo = {
  getProductTranslation,
  getProductTranslations,
  saveProductTranslation,
  deleteProductTranslation,
  approveProductTranslation,
  getCategoryTranslation,
  getCategoryTranslations,
  saveCategoryTranslation,
  getEntityTranslations,
  getEntityTranslation,
  getMissingTranslations,
  getTranslationStatistics,
  bulkApproveTranslations,
};

class LocalizationDataRepository {
  readonly countries = countryRepo;
  readonly currencies = currencyRepo;
  readonly languages = languageRepo;
  readonly locales = localeRepo;
  readonly translations = translationRepo;
}

export default new LocalizationDataRepository();
