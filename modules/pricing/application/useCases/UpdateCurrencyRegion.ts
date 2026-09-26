/**
 * UpdateCurrencyRegion Use Case
 *
 * Updates a currency region, validating that the region exists and that a new
 * currency code (if the currency is changing) resolves to a real currency.
 */

import { Currency, CurrencyRegion } from '../../domain/currency';
import { CurrencyRegionNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';

interface CurrencyRegionUpdatePort {
  getCurrencyRegionById(id: string): Promise<CurrencyRegion | null>;
  getCurrencyByCode(code: string): Promise<Currency | null>;
  updateCurrencyRegion(id: string, region: Partial<CurrencyRegion>): Promise<CurrencyRegion>;
}

export class UpdateCurrencyRegionUseCase {
  constructor(private readonly currencies: CurrencyRegionUpdatePort) {}

  async execute(id: string, regionData: Partial<CurrencyRegion>): Promise<CurrencyRegion> {
    const existingRegion = await this.currencies.getCurrencyRegionById(id);

    if (!existingRegion) {
      throw new CurrencyRegionNotFoundError(id);
    }

    if (regionData.currencyCode && regionData.currencyCode !== existingRegion.currencyCode) {
      const currency = await this.currencies.getCurrencyByCode(regionData.currencyCode);

      if (!currency) {
        throw new PricingValidationError(`Currency with code ${regionData.currencyCode} not found`);
      }
    }

    return this.currencies.updateCurrencyRegion(id, regionData);
  }
}
