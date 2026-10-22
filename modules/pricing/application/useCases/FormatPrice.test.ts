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
    const catalog = createCurrencyCatalog([createCurrency({ code: 'EUR', symbol: '€' })]);
    const useCase = new FormatPriceUseCase(catalog);

    expect(await useCase.execute({ priceCents: 123456 })).toBe('€1,234.56');
    expect(catalog.getDefault).toHaveBeenCalled();
  });

  it('should format with locale conventions when a locale is given', async () => {
    const catalog = createCurrencyCatalog([createCurrency({ code: 'EUR', symbol: '€' })]);
    const useCase = new FormatPriceUseCase(catalog);

    const formatted = await useCase.execute({ priceCents: 123456, locale: 'de-DE' });
    // de-DE renders EUR as "1.234,56 €" (symbol after, NBSP separator).
    expect(formatted).toMatch(/1\.234,56/);
    expect(formatted).toContain('€');
  });

  it('should format zero-decimal JPY without dividing by 100', async () => {
    const catalog = createCurrencyCatalog([createCurrency({ code: 'JPY' })]);
    const useCase = new FormatPriceUseCase(catalog);

    const formatted = await useCase.execute({ priceCents: 1500, currencyCode: 'JPY' });
    expect(formatted).toMatch(/1,500|1\.500|1500/);
  });

  it('should fall back to plain minor-unit formatting when the currency is unknown', async () => {
    const catalog = createCurrencyCatalog([]);
    const useCase = new FormatPriceUseCase(catalog);

    expect(await useCase.execute({ priceCents: 999, currencyCode: 'XXX' })).toBe('9.99');
    expect(await useCase.execute({ priceCents: 1500, currencyCode: 'JPY' })).toBe('1500');
  });
});
