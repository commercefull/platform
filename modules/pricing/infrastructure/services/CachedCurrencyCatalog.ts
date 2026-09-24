/**
 * Cached Currency Catalog
 *
 * Infrastructure decorator implementing `CurrencyCatalogPort` over the
 * currency repository. Preserves the caching behavior of the former
 * PricingService: currencies are memoized by code and the default
 * currency code is resolved once per process.
 */

import { Currency } from '../../domain/currency';
import { CurrencyCatalogPort } from '../../domain/repositories/CurrencyCatalog';
import currencyRepo from '../repositories/currencyRepo';

export class CachedCurrencyCatalog implements CurrencyCatalogPort {
  private readonly cache = new Map<string, Currency>();
  private defaultCurrencyCode: string | null = null;

  async getByCode(code: string): Promise<Currency | null> {
    if (this.cache.has(code)) {
      return this.cache.get(code) || null;
    }

    const currency = await currencyRepo.getCurrencyByCode(code);
    if (currency) {
      this.cache.set(code, currency);
    }

    return currency;
  }

  async getDefault(): Promise<Currency | null> {
    if (this.defaultCurrencyCode) {
      return this.getByCode(this.defaultCurrencyCode);
    }

    const defaultCurrency = await currencyRepo.getDefaultCurrency();
    if (defaultCurrency) {
      this.defaultCurrencyCode = defaultCurrency.code;
      this.cache.set(defaultCurrency.code, defaultCurrency);
    }

    return defaultCurrency;
  }
}
