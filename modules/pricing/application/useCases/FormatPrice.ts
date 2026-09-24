/**
 * FormatPrice Use Case
 *
 * Formats a price (integer cents) according to currency formatting rules.
 * Falls back to two-decimal formatting when the currency is unknown.
 */

import { CurrencyCatalogPort } from '../../domain/repositories/CurrencyCatalog';
import { formatCurrency } from '../../domain/currency';

export interface FormatPriceInput {
  /** Price in integer cents */
  priceCents: number;
  currencyCode?: string;
}

export class FormatPriceUseCase {
  constructor(private readonly currencyCatalog: CurrencyCatalogPort) {}

  async execute(input: FormatPriceInput): Promise<string> {
    const currency = input.currencyCode
      ? await this.currencyCatalog.getByCode(input.currencyCode)
      : await this.currencyCatalog.getDefault();

    if (!currency) {
      // Fallback to basic formatting
      return (input.priceCents / 100).toFixed(2);
    }

    return formatCurrency(input.priceCents / 100, currency);
  }
}
