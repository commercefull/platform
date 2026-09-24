/**
 * Unit Tests for GetCurrencyUseCase / GetDefaultCurrencyUseCase
 */

import { GetCurrencyUseCase, GetDefaultCurrencyUseCase } from './GetCurrency';
import { createCurrency, createCurrencyCatalog } from '../../tests/testUtils';

describe('GetCurrencyUseCase', () => {
  it('should return the currency for a known code', async () => {
    const usd = createCurrency({ code: 'USD' });
    const useCase = new GetCurrencyUseCase(createCurrencyCatalog([usd]));

    expect(await useCase.execute('USD')).toBe(usd);
  });

  it('should return null for an unknown code', async () => {
    const useCase = new GetCurrencyUseCase(createCurrencyCatalog([]));

    expect(await useCase.execute('XXX')).toBeNull();
  });
});

describe('GetDefaultCurrencyUseCase', () => {
  it('should return the default currency', async () => {
    const eur = createCurrency({ code: 'EUR', isDefault: true });
    const useCase = new GetDefaultCurrencyUseCase(createCurrencyCatalog([eur]));

    expect(await useCase.execute()).toBe(eur);
  });
});
