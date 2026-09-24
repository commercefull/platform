/**
 * Unit Tests for FormatPriceUseCase
 */

import { FormatPriceUseCase } from './FormatPrice';
import { createCurrency, createCurrencyCatalog } from '../../tests/testUtils';

describe('FormatPriceUseCase', () => {
  it('should format with the requested currency', async () => {
    const catalog = createCurrencyCatalog([createCurrency({ code: 'USD' })]);
    const useCase = new FormatPriceUseCase(catalog);

    expect(await useCase.execute({ priceCents: 12345, currencyCode: 'USD' })).toBe('$123.45');
    expect(catalog.getByCode).toHaveBeenCalledWith('USD');
  });

  it('should use the default currency when no code is given', async () => {
    const catalog = createCurrencyCatalog([createCurrency({ code: 'EUR', symbol: '€', symbolPosition: 'after', decimalSeparator: ',', thousandsSeparator: '.' })]);
    const useCase = new FormatPriceUseCase(catalog);

    expect(await useCase.execute({ priceCents: 123456 })).toBe('1.234,56€');
    expect(catalog.getDefault).toHaveBeenCalled();
  });

  it('should fall back to two-decimal formatting when the currency is unknown', async () => {
    const catalog = createCurrencyCatalog([]);
    const useCase = new FormatPriceUseCase(catalog);

    expect(await useCase.execute({ priceCents: 999, currencyCode: 'XXX' })).toBe('9.99');
  });
});
