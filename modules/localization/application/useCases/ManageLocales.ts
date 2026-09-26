import type { LocaleRecord, Country } from '../../domain/entities/LocalizationModel';
import type {
  LocaleCreateParams,
  LocaleUpdateParams,
  CountryCreateParams,
  CountryUpdateParams,
} from '../../domain/repositories/LocalizationRepository';
import {
  CountryNotFoundError,
  LocaleNotFoundError,
  LocalizationValidationError,
} from '../../domain/errors/LocalizationErrors';

interface LocalePort {
  findAll(activeOnly?: boolean): Promise<LocaleRecord[]>;
  findById(localeId: string): Promise<LocaleRecord | null>;
  findByCode(code: string): Promise<LocaleRecord | null>;
  findDefault(): Promise<LocaleRecord | null>;
  findByLanguage(language: string): Promise<LocaleRecord[]>;
  findByCountryCode(countryCode: string): Promise<LocaleRecord[]>;
  findByCurrency(currencyId: string): Promise<LocaleRecord[]>;
  getStatistics(): Promise<unknown>;
  create(params: LocaleCreateParams): Promise<LocaleRecord>;
  update(localeId: string, params: LocaleUpdateParams): Promise<LocaleRecord | null>;
  delete(localeId: string): Promise<boolean>;
  setAsDefault(localeId: string): Promise<LocaleRecord | null>;
  activate(localeId: string): Promise<LocaleRecord | null>;
  deactivate(localeId: string): Promise<LocaleRecord | null>;
}

interface CountryPort {
  findAll(activeOnly?: boolean): Promise<Country[]>;
  findById(countryId: string): Promise<Country | null>;
  findByCode(code: string): Promise<Country | null>;
  findByRegion(region: string): Promise<Country[]>;
  create(params: CountryCreateParams): Promise<Country>;
  update(countryId: string, params: CountryUpdateParams): Promise<Country | null>;
  delete(countryId: string): Promise<boolean>;
  activate(countryId: string): Promise<Country | null>;
  deactivate(countryId: string): Promise<Country | null>;
}

function assertFound<T>(record: T | null | false | undefined, notFound: Error): T {
  if (!record) {
    throw notFound;
  }
  return record;
}

export class ManageLocalesUseCase {
  constructor(
    private readonly localeRepo: LocalePort,
    private readonly countryRepo: CountryPort,
  ) {}

  async listLocales(filters: { activeOnly?: boolean; language?: string; countryCode?: string; currency?: string }) {
    if (filters.language) {
      return this.localeRepo.findByLanguage(filters.language);
    }
    if (filters.countryCode) {
      return this.localeRepo.findByCountryCode(filters.countryCode);
    }
    if (filters.currency) {
      return this.localeRepo.findByCurrency(filters.currency);
    }
    return this.localeRepo.findAll(filters.activeOnly);
  }

  async findLocales(activeOnly?: boolean) {
    return this.localeRepo.findAll(activeOnly);
  }

  async findLocaleByCode(code: string) {
    return this.localeRepo.findByCode(code);
  }

  async findDefaultLocale() {
    return this.localeRepo.findDefault();
  }

  async findCountryByCode(code: string) {
    return this.countryRepo.findByCode(code);
  }

  async findCountries(activeOnly?: boolean) {
    return this.countryRepo.findAll(activeOnly);
  }

  async getLocaleById(localeId: string) {
    return assertFound(await this.localeRepo.findById(localeId), new LocaleNotFoundError(localeId));
  }

  async getLocaleByCode(code: string) {
    return assertFound(await this.localeRepo.findByCode(code), new LocaleNotFoundError(code));
  }

  async getDefaultLocale() {
    return assertFound(await this.localeRepo.findDefault(), new LocaleNotFoundError('default'));
  }

  async getLocalesByLanguage(language: string) {
    return this.localeRepo.findByLanguage(language);
  }

  async getLocalesByCountry(countryCode: string) {
    return this.localeRepo.findByCountryCode(countryCode);
  }

  async getStatistics() {
    return this.localeRepo.getStatistics();
  }

  async createLocale(params: LocaleCreateParams) {
    const errors: string[] = [];
    if (!params.code) errors.push('code is required');
    if (!params.name) errors.push('name is required');
    if (!params.language) errors.push('language is required');
    if (errors.length > 0) {
      throw new LocalizationValidationError(errors.join('; '));
    }
    return this.localeRepo.create(params);
  }

  async updateLocale(localeId: string, params: LocaleUpdateParams) {
    return assertFound(await this.localeRepo.update(localeId, params), new LocaleNotFoundError(localeId));
  }

  async deleteLocale(localeId: string) {
    assertFound(await this.localeRepo.delete(localeId), new LocaleNotFoundError(localeId));
  }

  async setLocaleAsDefault(localeId: string) {
    return assertFound(await this.localeRepo.setAsDefault(localeId), new LocaleNotFoundError(localeId));
  }

  async activateLocale(localeId: string) {
    return assertFound(await this.localeRepo.activate(localeId), new LocaleNotFoundError(localeId));
  }

  async deactivateLocale(localeId: string) {
    return assertFound(await this.localeRepo.deactivate(localeId), new LocaleNotFoundError(localeId));
  }

  async listCountries(filters: { activeOnly?: boolean; region?: string }) {
    if (filters.region) {
      return this.countryRepo.findByRegion(filters.region);
    }
    return this.countryRepo.findAll(filters.activeOnly);
  }

  async getCountryById(countryId: string) {
    return assertFound(await this.countryRepo.findById(countryId), new CountryNotFoundError(countryId));
  }

  async getCountryByCode(code: string) {
    return assertFound(await this.countryRepo.findByCode(code), new CountryNotFoundError(code));
  }

  async getCountriesByRegion(region: string) {
    return this.countryRepo.findByRegion(region);
  }

  async createCountry(params: CountryCreateParams) {
    const errors: string[] = [];
    if (!params.code) errors.push('code is required');
    if (!params.name) errors.push('name is required');
    if (errors.length > 0) {
      throw new LocalizationValidationError(errors.join('; '));
    }
    return this.countryRepo.create(params);
  }

  async updateCountry(countryId: string, params: CountryUpdateParams) {
    return assertFound(await this.countryRepo.update(countryId, params), new CountryNotFoundError(countryId));
  }

  async deleteCountry(countryId: string) {
    assertFound(await this.countryRepo.delete(countryId), new CountryNotFoundError(countryId));
  }

  async activateCountry(countryId: string) {
    return assertFound(await this.countryRepo.activate(countryId), new CountryNotFoundError(countryId));
  }

  async deactivateCountry(countryId: string) {
    return assertFound(await this.countryRepo.deactivate(countryId), new CountryNotFoundError(countryId));
  }
}
