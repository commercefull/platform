/**
 * CreateCurrencyPriceRule Use Case
 *
 * Creates a currency price rule after validating required fields and that the
 * referenced currency (and region, when specified) exist.
 */

import { Currency, CurrencyRegion } from '../../domain/currency';
import { CurrencyPriceRule, CurrencyPriceRuleCreateProps } from '../../domain/pricingRule';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

interface CurrencyPriceRuleCreatePort {
  getCurrencyByCode(code: string): Promise<Currency | null>;
  getCurrencyRegionByCode(regionCode: string): Promise<CurrencyRegion | null>;
  create(data: CurrencyPriceRuleCreateProps): Promise<CurrencyPriceRule>;
}

export class CreateCurrencyPriceRuleUseCase {
  constructor(private readonly port: CurrencyPriceRuleCreatePort) {}

  async execute(ruleData: CurrencyPriceRuleCreateProps): Promise<CurrencyPriceRule> {
    if (!ruleData.currencyCode || ruleData.priority === undefined || !ruleData.adjustments || ruleData.adjustments.length === 0) {
      throw new PricingValidationError(
        'Missing required fields: currencyCode, priority, and at least one adjustment are required',
      );
    }

    const currency = await this.port.getCurrencyByCode(ruleData.currencyCode);

    if (!currency) {
      throw new PricingValidationError('Currency not found');
    }

    if (ruleData.regionCode) {
      const region = await this.port.getCurrencyRegionByCode(ruleData.regionCode);

      if (!region) {
        throw new PricingValidationError(`Region with code ${ruleData.regionCode} not found`);
      }
    }

    return this.port.create(ruleData);
  }
}
