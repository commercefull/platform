import localizationDataRepository from '../infrastructure/repositories/LocalizationDataRepository';
import type { CountryCreateParams, CountryUpdateParams } from '../infrastructure/repositories/LocalizationDataRepository';
import { ManageLanguagesUseCase } from './useCases/ManageLanguages';
import { ManageCurrenciesUseCase } from './useCases/ManageCurrencies';
import { ManageCountriesUseCase } from './useCases/ManageCountries';

export const manageLanguagesUseCase = new ManageLanguagesUseCase(localizationDataRepository.languages);
export const manageCurrenciesUseCase = new ManageCurrenciesUseCase(localizationDataRepository.currencies);
export const manageCountriesUseCase = new ManageCountriesUseCase(localizationDataRepository.countries);

export { localizationDataRepository, CountryCreateParams, CountryUpdateParams };
