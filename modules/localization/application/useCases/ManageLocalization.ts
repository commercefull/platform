import type { LanguageRepositoryPort, CurrencyRepositoryPort, CountryRepositoryPort } from '../../domain/repositories/LocalizationRepository';
import { localizationDataRepository } from '../wired';

const languageRepo: LanguageRepositoryPort = localizationDataRepository.languages;
const currencyRepo: CurrencyRepositoryPort = localizationDataRepository.currencies;
const countryRepo: CountryRepositoryPort = localizationDataRepository.countries;

export class ManageLanguagesUseCase {
  async listLanguages() {
    return languageRepo.listLanguages();
  }
  async findLanguageById(id: string) {
    return languageRepo.findLanguageById(id);
  }
  async createLanguage(params: Parameters<typeof languageRepo.createLanguage>[0]) {
    return languageRepo.createLanguage(params);
  }
  async updateLanguage(id: string, updates: Parameters<typeof languageRepo.updateLanguage>[1]) {
    return languageRepo.updateLanguage(id, updates);
  }
  async deleteLanguage(id: string) {
    return languageRepo.deleteLanguage(id);
  }
}

export class ManageCurrenciesUseCase {
  async listCurrencies() {
    return currencyRepo.listCurrencies();
  }
  async listActiveCurrencyCodes() {
    return currencyRepo.listActiveCurrencyCodes();
  }
  async findCurrencyById(id: string) {
    return currencyRepo.findCurrencyById(id);
  }
  async createCurrency(params: Parameters<typeof currencyRepo.createCurrency>[0]) {
    return currencyRepo.createCurrency(params);
  }
  async updateCurrency(id: string, updates: Parameters<typeof currencyRepo.updateCurrency>[1]) {
    return currencyRepo.updateCurrency(id, updates);
  }
  async deleteCurrency(id: string) {
    return currencyRepo.deleteCurrency(id);
  }
}

export class ManageCountriesUseCase {
  async findAll() {
    return countryRepo.findAll();
  }
}
