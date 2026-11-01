/**
 * FormatPrice Use Case
 *
 * Formats a price (integer minor units) according to CLDR currency
 * formatting rules via `libs/money`. Falls back to plain numeric
 * formatting when the currency is unknown.
 */

import { CurrencyCatalogPort } from '../../domain/repositories/CurrencyCatalog';
import { formatCurrency } from '../../domain/currency';
import { fromMinorUnits, getCurrencyDecimals } from '../../../../libs/money';

export interface FormatPriceInput {
  /** Price in integer minor units */
  priceCents: number;
  currencyCode?: string;
  /** BCP 47 locale for CLDR formatting (defaults to en-US). */
  locale?: string;
}

export class FormatPriceUseCase {
  constructor(private readonly currencyCatalog: CurrencyCatalogPort) {}

  async execute(input: FormatPriceInput): Promise<string> {
    const currency = input.currencyCode
      ? await this.currencyCatalog.getByCode(input.currencyCode)
      : await this.currencyCatalog.getDefault();

    if (!currency) {
      // Fallback to plain numeric formatting in the input's minor units.
      const code = input.currencyCode ?? 'USD';
      return fromMinorUnits(input.priceCents, code).toFixed(getCurrencyDecimals(code));
    }

    return formatCurrency(fromMinorUnits(input.priceCents, currency.code), currency, input.locale);
  }
}
