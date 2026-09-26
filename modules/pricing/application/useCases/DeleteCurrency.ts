/**
 * DeleteCurrency Use Case
 *
 * Deletes a currency, enforcing the default-currency invariant.
 */

import { Currency } from '../../domain/currency';
import { CurrencyNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';

interface CurrencyDeletePort {
  getCurrencyByCode(code: string): Promise<Currency | null>;
  deleteCurrency(code: string): Promise<boolean>;
}

export class DeleteCurrencyUseCase {
  constructor(private readonly currencies: CurrencyDeletePort) {}

  async execute(code: string): Promise<void> {
    const currency = await this.currencies.getCurrencyByCode(code);

    if (!currency) {
      throw new CurrencyNotFoundError(code);
    }

    if (currency.isDefault) {
      throw new PricingValidationError('Cannot delete the default currency');
    }

    await this.currencies.deleteCurrency(code);
  }
}
