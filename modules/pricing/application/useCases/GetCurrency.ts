/**
 * GetCurrency Use Case
 *
 * Looks up a currency by ISO code, or the store's default currency.
 */

import { CurrencyCatalogPort } from '../../domain/repositories/CurrencyCatalog';
import { Currency } from '../../domain/currency';

export class GetCurrencyUseCase {
  constructor(private readonly currencyCatalog: CurrencyCatalogPort) {}

  async execute(code: string): Promise<Currency | null> {
    return this.currencyCatalog.getByCode(code);
  }
}

export class GetDefaultCurrencyUseCase {
  constructor(private readonly currencyCatalog: CurrencyCatalogPort) {}

  async execute(): Promise<Currency | null> {
    return this.currencyCatalog.getDefault();
  }
}
