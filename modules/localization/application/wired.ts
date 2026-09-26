import localizationDataRepository from '../infrastructure/repositories/LocalizationDataRepository';
import type { CountryCreateParams, CountryUpdateParams } from '../infrastructure/repositories/LocalizationDataRepository';
import { ManageLanguagesUseCase } from './useCases/ManageLanguages';
import { ManageCurrenciesUseCase } from './useCases/ManageCurrencies';
import { ManageCountriesUseCase } from './useCases/ManageCountries';
import { ManageLocalesUseCase } from './useCases/ManageLocales';

export const manageLanguagesUseCase = new ManageLanguagesUseCase(localizationDataRepository.languages);
export const manageCurrenciesUseCase = new ManageCurrenciesUseCase(localizationDataRepository.currencies);
export const manageCountriesUseCase = new ManageCountriesUseCase(localizationDataRepository.countries);
export const manageLocalesUseCase = new ManageLocalesUseCase(localizationDataRepository.locales, localizationDataRepository.countries);

export { localizationDataRepository, CountryCreateParams, CountryUpdateParams };

import { ConvertCurrencyUseCase } from './useCases/ConvertCurrency';
import { CreateCurrencyUseCase } from './useCases/CreateCurrency';
import { CreateLocaleUseCase } from './useCases/CreateLocale';
import { SetExchangeRateUseCase } from './useCases/SetExchangeRate';

export const convertCurrencyUseCase = new ConvertCurrencyUseCase(localizationDataRepository.currencies as never);
export const createCurrencyUseCase = new CreateCurrencyUseCase(localizationDataRepository.currencies as never);
export const createLocaleUseCase = new CreateLocaleUseCase(localizationDataRepository.locales as never);
export const setExchangeRateUseCase = new SetExchangeRateUseCase(localizationDataRepository.currencies as never);
