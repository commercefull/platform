/**
 * Consolidated Localization Data Repository
 *
 * Merges countryRepo, currencyRepo, languageRepo, localeRepo, translationRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Localization (countries, currencies, languages, locales, translations)
 */

import countryRepo from './countryRepo';
import * as currencyRepo from './currencyRepo';
import * as languageRepo from './languageRepo';
import localeRepo from './localeRepo';
import * as translationRepo from './translationRepo';

// Re-export types for backward compatibility
export type { CountryCreateParams, CountryUpdateParams } from './countryRepo';

class LocalizationDataRepository {
  readonly countries = countryRepo;
  readonly currencies = currencyRepo;
  readonly languages = languageRepo;
  readonly locales = localeRepo;
  readonly translations = translationRepo;
}

export default new LocalizationDataRepository();
