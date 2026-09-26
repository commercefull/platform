/**
 * CreateCurrencyRegion Use Case
 *
 * Creates a currency region after validating required fields and that the
 * referenced currency exists.
 */

import { Currency, CurrencyRegion } from '../../domain/currency';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

interface CurrencyRegionWritePort {
  getCurrencyByCode(code: string): Promise<Currency | null>;
  createCurrencyRegion(region: CurrencyRegion): Promise<CurrencyRegion>;
}

export class CreateCurrencyRegionUseCase {
  constructor(private readonly currencies: CurrencyRegionWritePort) {}

  async execute(regionData: CurrencyRegion): Promise<CurrencyRegion> {
    if (!regionData.code || !regionData.name || !regionData.currencyCode) {
      throw new PricingValidationError('Missing required fields: code, name, and currencyCode are required');
    }

    const currency = await this.currencies.getCurrencyByCode(regionData.currencyCode);

    if (!currency) {
      throw new PricingValidationError(`Currency with code ${regionData.currencyCode} not found`);
    }

    return this.currencies.createCurrencyRegion(regionData);
  }
}
