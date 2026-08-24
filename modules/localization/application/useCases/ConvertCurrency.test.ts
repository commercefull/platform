import { ConvertCurrencyUseCase } from './ConvertCurrency';
import { CurrencyNotFoundError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('ConvertCurrencyUseCase', () => {
  let useCase: ConvertCurrencyUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = { findCurrencyByCode: jest.fn() };
    useCase = new ConvertCurrencyUseCase(mockRepo as never);
  });

  it('should convert between currencies (happy path)', async () => {
    mockRepo.findCurrencyByCode
      .mockResolvedValueOnce({ currencyId: 'c1', code: 'EUR', exchangeRate: 0.85 })
      .mockResolvedValueOnce({ currencyId: 'c2', code: 'GBP', exchangeRate: 0.73 });

    const result = await useCase.execute({ amount: 100, fromCurrency: 'EUR', toCurrency: 'GBP' });

    expect(result.originalAmount).toBe(100);
    expect(result.targetCurrency).toBe('GBP');
    expect(result.exchangeRate).toBeCloseTo(0.8588, 3);
  });

  it('should return same amount when currencies are the same', async () => {
    const result = await useCase.execute({ amount: 100, fromCurrency: 'USD', toCurrency: 'USD' });

    expect(result.convertedAmount).toBe(100);
    expect(result.exchangeRate).toBe(1);
    expect(mockRepo.findCurrencyByCode).not.toHaveBeenCalled();
  });

  it('should throw LocalizationValidationError when required fields missing', async () => {
    await expect(useCase.execute({ amount: 100, fromCurrency: '', toCurrency: 'USD' })).rejects.toThrow(LocalizationValidationError);
    await expect(useCase.execute({ amount: 100, fromCurrency: 'USD', toCurrency: '' })).rejects.toThrow(LocalizationValidationError);
  });

  it('should throw CurrencyNotFoundError when source currency not found', async () => {
    mockRepo.findCurrencyByCode.mockResolvedValue(null);

    await expect(useCase.execute({ amount: 100, fromCurrency: 'XYZ', toCurrency: 'USD' })).rejects.toThrow(CurrencyNotFoundError);
  });

  it('should throw CurrencyNotFoundError when target currency not found', async () => {
    mockRepo.findCurrencyByCode
      .mockResolvedValueOnce({ currencyId: 'c1', code: 'USD', exchangeRate: 1 })
      .mockResolvedValueOnce(null);

    await expect(useCase.execute({ amount: 100, fromCurrency: 'USD', toCurrency: 'XYZ' })).rejects.toThrow(CurrencyNotFoundError);
  });
});
