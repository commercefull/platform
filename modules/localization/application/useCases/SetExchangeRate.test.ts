import { createSetExchangeRateRepository } from '../../tests/testUtils';
import { SetExchangeRateUseCase } from './SetExchangeRate';
import { CurrencyNotFoundError, InvalidExchangeRateError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('SetExchangeRateUseCase', () => {
  it('should update the rate and record history when the currency exists', async () => {
    const repository = createSetExchangeRateRepository({ currencyId: 'c1', exchangeRate: 1.2 });

    const result = await new SetExchangeRateUseCase(repository).execute({ currencyCode: 'EUR', exchangeRate: 0.9 });

    expect(result.currencyCode).toBe('EUR');
    expect(result.previousRate).toBe(1.2);
    expect(result.newRate).toBe(0.9);
    expect(repository.updateCurrency).toHaveBeenCalledWith('c1', expect.objectContaining({ exchangeRate: 0.9 }));
    expect(repository.createExchangeRateHistory).toHaveBeenCalledWith(
      expect.objectContaining({ currencyCode: 'EUR', rate: 0.9, previousRate: 1.2, source: 'manual' }),
    );
  });

  it('should use the provided source and effective date when given', async () => {
    const repository = createSetExchangeRateRepository({ currencyId: 'c1', exchangeRate: 1 });
    const effectiveDate = new Date('2026-03-01');

    const result = await new SetExchangeRateUseCase(repository).execute({
      currencyCode: 'EUR',
      exchangeRate: 0.9,
      effectiveDate,
      source: 'ecb',
    });

    expect(result.effectiveDate).toBe('2026-03-01T00:00:00.000Z');
    expect(repository.createExchangeRateHistory).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'ecb', effectiveDate }),
    );
  });

  it('should throw LocalizationValidationError when required fields are missing', async () => {
    const repository = createSetExchangeRateRepository();

    await expect(
      new SetExchangeRateUseCase(repository).execute({ currencyCode: '', exchangeRate: 1 }),
    ).rejects.toThrow(LocalizationValidationError);
    expect(repository.updateCurrency).not.toHaveBeenCalled();
  });

  it.each([0, -1])('should throw InvalidExchangeRateError when the rate is %s', async exchangeRate => {
    const repository = createSetExchangeRateRepository();

    await expect(
      new SetExchangeRateUseCase(repository).execute({ currencyCode: 'EUR', exchangeRate }),
    ).rejects.toThrow(InvalidExchangeRateError);
    expect(repository.updateCurrency).not.toHaveBeenCalled();
  });

  it('should throw CurrencyNotFoundError when the currency does not exist', async () => {
    const repository = createSetExchangeRateRepository(null);

    await expect(
      new SetExchangeRateUseCase(repository).execute({ currencyCode: 'XYZ', exchangeRate: 1 }),
    ).rejects.toThrow(CurrencyNotFoundError);
    expect(repository.updateCurrency).not.toHaveBeenCalled();
    expect(repository.createExchangeRateHistory).not.toHaveBeenCalled();
  });
});
