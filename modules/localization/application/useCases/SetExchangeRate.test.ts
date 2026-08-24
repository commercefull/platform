import { SetExchangeRateUseCase } from './SetExchangeRate';
import { CurrencyNotFoundError, InvalidExchangeRateError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('SetExchangeRateUseCase', () => {
  let useCase: SetExchangeRateUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findCurrencyByCode: jest.fn().mockResolvedValue({ currencyId: 'c1', exchangeRate: 1.2 }),
      updateCurrency: jest.fn().mockResolvedValue(undefined),
      createExchangeRateHistory: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SetExchangeRateUseCase(mockRepo as never);
  });

  it('should set exchange rate successfully (happy path)', async () => {
    const result = await useCase.execute({ currencyCode: 'EUR', exchangeRate: 0.9 });

    expect(result.currencyCode).toBe('EUR');
    expect(result.previousRate).toBe(1.2);
    expect(result.newRate).toBe(0.9);
    expect(mockRepo.updateCurrency).toHaveBeenCalledWith('c1', expect.objectContaining({ exchangeRate: 0.9 }));
    expect(mockRepo.createExchangeRateHistory).toHaveBeenCalledWith(expect.objectContaining({ currencyCode: 'EUR', rate: 0.9, previousRate: 1.2 }));
  });

  it('should throw LocalizationValidationError when currencyCode is empty', async () => {
    await expect(useCase.execute({ currencyCode: '', exchangeRate: 1 })).rejects.toThrow(LocalizationValidationError);
  });

  it('should throw InvalidExchangeRateError when rate is <= 0', async () => {
    await expect(useCase.execute({ currencyCode: 'EUR', exchangeRate: 0 })).rejects.toThrow(InvalidExchangeRateError);
    await expect(useCase.execute({ currencyCode: 'EUR', exchangeRate: -1 })).rejects.toThrow(InvalidExchangeRateError);
  });

  it('should throw CurrencyNotFoundError when currency does not exist', async () => {
    mockRepo.findCurrencyByCode.mockResolvedValue(null);

    await expect(useCase.execute({ currencyCode: 'XYZ', exchangeRate: 1 })).rejects.toThrow(CurrencyNotFoundError);
  });
});
