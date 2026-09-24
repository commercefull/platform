import { createConvertCurrencyRepository } from '../../tests/testUtils';
import { ConvertCurrencyUseCase } from './ConvertCurrency';
import { CurrencyNotFoundError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('ConvertCurrencyUseCase', () => {
  it('should convert through the base rate when converting between currencies', async () => {
    const repository = createConvertCurrencyRepository();
    repository.findCurrencyByCode
      .mockResolvedValueOnce({ currencyId: 'c1', code: 'EUR', exchangeRate: 0.85 })
      .mockResolvedValueOnce({ currencyId: 'c2', code: 'GBP', exchangeRate: 0.73 });

    const result = await new ConvertCurrencyUseCase(repository).execute({ amount: 100, fromCurrency: 'EUR', toCurrency: 'GBP' });

    expect(result.originalAmount).toBe(100);
    expect(result.targetCurrency).toBe('GBP');
    expect(result.convertedAmount).toBe(85.88);
    expect(result.exchangeRate).toBeCloseTo(0.8588, 3);
  });

  it('should return the same amount without a lookup when the currencies are the same', async () => {
    const repository = createConvertCurrencyRepository();

    const result = await new ConvertCurrencyUseCase(repository).execute({ amount: 100, fromCurrency: 'USD', toCurrency: 'USD' });

    expect(result.convertedAmount).toBe(100);
    expect(result.exchangeRate).toBe(1);
    expect(repository.findCurrencyByCode).not.toHaveBeenCalled();
  });

  it('should throw LocalizationValidationError when required fields are missing', async () => {
    const repository = createConvertCurrencyRepository();

    await expect(
      new ConvertCurrencyUseCase(repository).execute({ amount: 100, fromCurrency: '', toCurrency: 'USD' }),
    ).rejects.toThrow(LocalizationValidationError);
    await expect(
      new ConvertCurrencyUseCase(repository).execute({ amount: 100, fromCurrency: 'USD', toCurrency: '' }),
    ).rejects.toThrow(LocalizationValidationError);
    expect(repository.findCurrencyByCode).not.toHaveBeenCalled();
  });

  it('should throw CurrencyNotFoundError when the source currency does not exist', async () => {
    const repository = createConvertCurrencyRepository();

    await expect(
      new ConvertCurrencyUseCase(repository).execute({ amount: 100, fromCurrency: 'XYZ', toCurrency: 'USD' }),
    ).rejects.toThrow(CurrencyNotFoundError);
    expect(repository.findCurrencyByCode).toHaveBeenCalledTimes(1);
  });

  it('should throw CurrencyNotFoundError when the target currency does not exist', async () => {
    const repository = createConvertCurrencyRepository();
    repository.findCurrencyByCode
      .mockResolvedValueOnce({ currencyId: 'c1', code: 'USD', exchangeRate: 1 })
      .mockResolvedValueOnce(null);

    await expect(
      new ConvertCurrencyUseCase(repository).execute({ amount: 100, fromCurrency: 'USD', toCurrency: 'XYZ' }),
    ).rejects.toThrow(CurrencyNotFoundError);
  });
});
