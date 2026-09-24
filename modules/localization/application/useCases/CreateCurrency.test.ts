import { createCreateCurrencyRepository, createCreatedCurrency } from '../../tests/testUtils';
import { CreateCurrencyUseCase } from './CreateCurrency';
import { CurrencyCodeAlreadyExistsError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('CreateCurrencyUseCase', () => {
  it('should create the currency when the code is available', async () => {
    const repository = createCreateCurrencyRepository();

    const result = await new CreateCurrencyUseCase(repository).execute({ code: 'USD', name: 'US Dollar', symbol: '$' });

    expect(result.currencyId).toMatch(/^cur_/);
    expect(result.code).toBe('USD');
    expect(result.symbol).toBe('$');
    expect(repository.createCurrency).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'USD',
        symbolPosition: 'before',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        exchangeRate: 1,
        isDefault: false,
        isActive: true,
      }),
    );
  });

  it('should uppercase the code when creating the currency', async () => {
    const repository = createCreateCurrencyRepository();

    const result = await new CreateCurrencyUseCase(repository).execute({ code: 'eur', name: 'Euro', symbol: '€' });

    expect(result.code).toBe('EUR');
  });

  it('should throw LocalizationValidationError when required fields are missing', async () => {
    const repository = createCreateCurrencyRepository();

    await expect(
      new CreateCurrencyUseCase(repository).execute({ code: '', name: 'Dollar', symbol: '$' }),
    ).rejects.toThrow(LocalizationValidationError);
    await expect(
      new CreateCurrencyUseCase(repository).execute({ code: 'USD', name: '', symbol: '$' }),
    ).rejects.toThrow(LocalizationValidationError);
    expect(repository.createCurrency).not.toHaveBeenCalled();
  });

  it('should throw CurrencyCodeAlreadyExistsError when the code is taken', async () => {
    const repository = createCreateCurrencyRepository(createCreatedCurrency());

    await expect(
      new CreateCurrencyUseCase(repository).execute({ code: 'USD', name: 'Dollar', symbol: '$' }),
    ).rejects.toThrow(CurrencyCodeAlreadyExistsError);
    expect(repository.createCurrency).not.toHaveBeenCalled();
  });
});
