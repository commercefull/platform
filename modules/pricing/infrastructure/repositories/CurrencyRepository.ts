/**
 * Consolidated Currency Repository
 *
 * Merges currencyRepo, currencyExchangeRateRepo, and storeCurrencySettingsRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Currency (currencies, exchange rates, store currency settings)
 */

import currencyRepo from './currencyRepo';
import currencyExchangeRateRepo from './currencyExchangeRateRepo';
import storeCurrencySettingsRepo from './storeCurrencySettingsRepo';

// Re-export types for backward compatibility
export type { Currency, CurrencyRegion } from '../../domain/currency';
export type { CurrencyExchangeRateCreateParams, CurrencyExchangeRateUpdateParams } from './currencyExchangeRateRepo';
export type { RoundingMethod, PriceDisplayFormat, StoreCurrencySettingsCreateParams, StoreCurrencySettingsUpdateParams } from './storeCurrencySettingsRepo';

class CurrencyRepository {
  // Currencies
  readonly currencies = currencyRepo;
  // Exchange Rates
  readonly exchangeRates = currencyExchangeRateRepo;
  // Store Currency Settings
  readonly storeSettings = storeCurrencySettingsRepo;

  // Delegate commonly used methods directly
  async getAllCurrencies(activeOnly?: boolean) {
    return currencyRepo.getAllCurrencies(activeOnly);
  }
  async getCurrencyByCode(code: string) {
    return currencyRepo.getCurrencyByCode(code);
  }
}

export default new CurrencyRepository();
