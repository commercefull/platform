import {
  createCurrencyRepository,
  createCurrency,
} from '../../tests/testUtils';
import { ManageCurrenciesUseCase } from './ManageCurrencies';

describe('ManageCurrenciesUseCase', () => {
  it('should list currencies when asked', async () => {
    const repository = createCurrencyRepository();

    const result = await new ManageCurrenciesUseCase(repository).listCurrencies();

    expect(result).toHaveLength(1);
  });

  it('should list active currency codes when asked', async () => {
    const repository = createCurrencyRepository();

    const result = await new ManageCurrenciesUseCase(repository).listActiveCurrencyCodes();

    expect(result).toEqual([{ code: 'USD', name: 'US Dollar' }]);
  });

  it('should return the currency when looking it up by id', async () => {
    const currency = createCurrency({ code: 'EUR' });
    const repository = createCurrencyRepository();
    repository.findCurrencyById.mockResolvedValue(currency);

    const result = await new ManageCurrenciesUseCase(repository).findCurrencyById('cur-1');

    expect(result).toBe(currency);
  });

  it('should update the currency when an id is given', async () => {
    const repository = createCurrencyRepository();

    await new ManageCurrenciesUseCase(repository).updateCurrency('cur-1', { isActive: false });

    expect(repository.updateCurrency).toHaveBeenCalledWith('cur-1', { isActive: false });
  });
});

