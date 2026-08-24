jest.mock('../../infrastructure/repositories/LocalizationDataRepository', () => ({
  __esModule: true,
  default: {
    languages: {
      listLanguages: jest.fn().mockResolvedValue([{ languageId: 'l1' }]),
      findLanguageById: jest.fn().mockResolvedValue({ languageId: 'l1' }),
      createLanguage: jest.fn().mockResolvedValue({ languageId: 'l2' }),
      updateLanguage: jest.fn().mockResolvedValue(undefined),
      deleteLanguage: jest.fn().mockResolvedValue(undefined),
    },
    currencies: {
      listCurrencies: jest.fn().mockResolvedValue([{ currencyId: 'c1' }]),
      listActiveCurrencyCodes: jest.fn().mockResolvedValue(['USD', 'EUR']),
      findCurrencyById: jest.fn().mockResolvedValue({ currencyId: 'c1' }),
      createCurrency: jest.fn().mockResolvedValue({ currencyId: 'c2' }),
      updateCurrency: jest.fn().mockResolvedValue(undefined),
      deleteCurrency: jest.fn().mockResolvedValue(undefined),
    },
    countries: {
      findAll: jest.fn().mockResolvedValue([{ countryId: 'cy1' }]),
    },
  },
}));

import { ManageLanguagesUseCase, ManageCurrenciesUseCase, ManageCountriesUseCase } from './ManageLocalization';
import localizationDataRepository from '../../infrastructure/repositories/LocalizationDataRepository';

const mockRepo = localizationDataRepository as unknown as Record<string, Record<string, jest.Mock>>;

describe('ManageLanguagesUseCase', () => {
  let useCase: ManageLanguagesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageLanguagesUseCase();
  });

  it('should list languages', async () => {
    const result = await useCase.listLanguages();
    expect(result).toHaveLength(1);
  });

  it('should create language', async () => {
    const result = await useCase.createLanguage({ code: 'en', name: 'English' } as never);
    expect(result).toEqual({ languageId: 'l2' });
  });

  it('should delete language', async () => {
    await useCase.deleteLanguage('l1');
    expect(mockRepo.languages.deleteLanguage).toHaveBeenCalledWith('l1');
  });
});

describe('ManageCurrenciesUseCase', () => {
  let useCase: ManageCurrenciesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageCurrenciesUseCase();
  });

  it('should list currencies', async () => {
    const result = await useCase.listCurrencies();
    expect(result).toHaveLength(1);
  });

  it('should list active currency codes', async () => {
    const result = await useCase.listActiveCurrencyCodes();
    expect(result).toEqual(['USD', 'EUR']);
  });

  it('should update currency', async () => {
    await useCase.updateCurrency('c1', { isActive: false } as never);
    expect(mockRepo.currencies.updateCurrency).toHaveBeenCalledWith('c1', { isActive: false });
  });
});

describe('ManageCountriesUseCase', () => {
  let useCase: ManageCountriesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageCountriesUseCase();
  });

  it('should find all countries', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });
});
