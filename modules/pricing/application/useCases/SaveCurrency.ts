/**
 * SaveCurrency Use Case
 *
 * Upserts a currency definition and reports whether it was created or updated.
 */

import { Currency } from '../../domain/currency';

export interface SaveCurrencyOutput {
  currency: Currency;
  created: boolean;
}

interface CurrencyWritePort {
  getCurrencyByCode(code: string): Promise<Currency | null>;
  saveCurrency(currency: Currency): Promise<Currency>;
}

export class SaveCurrencyUseCase {
  constructor(private readonly currencies: CurrencyWritePort) {}

  async execute(currency: Currency): Promise<SaveCurrencyOutput> {
    const existing = await this.currencies.getCurrencyByCode(currency.code);
    const saved = await this.currencies.saveCurrency(currency);
    return { currency: saved, created: !existing };
  }
}
