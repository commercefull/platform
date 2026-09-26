/**
 * UpdateCurrencyPriceRule Use Case
 *
 * Updates a currency price rule, validating that the rule exists and that a
 * new currency or region code (when changed) resolves to a real record.
 */

import { Currency, CurrencyRegion } from '../../domain/currency';
import { CurrencyPriceRule, CurrencyPriceRuleUpdateProps } from '../../domain/pricingRule';
import { PricingRuleNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';

interface CurrencyPriceRuleUpdatePort {
  findById(id: string): Promise<CurrencyPriceRule | null>;
  getCurrencyByCode(code: string): Promise<Currency | null>;
  getCurrencyRegionByCode(regionCode: string): Promise<CurrencyRegion | null>;
  update(id: string, data: CurrencyPriceRuleUpdateProps): Promise<CurrencyPriceRule>;
}

export class UpdateCurrencyPriceRuleUseCase {
  constructor(private readonly port: CurrencyPriceRuleUpdatePort) {}

  async execute(id: string, ruleData: CurrencyPriceRuleUpdateProps): Promise<CurrencyPriceRule> {
    const existingRule = await this.port.findById(id);

    if (!existingRule) {
      throw new PricingRuleNotFoundError(id);
    }

    if (ruleData.currencyCode && ruleData.currencyCode !== existingRule.currencyCode) {
      const currency = await this.port.getCurrencyByCode(ruleData.currencyCode);

      if (!currency) {
        throw new PricingValidationError(`Currency with code ${ruleData.currencyCode} not found`);
      }
    }

    if (ruleData.regionCode && ruleData.regionCode !== existingRule.regionCode) {
      const region = await this.port.getCurrencyRegionByCode(ruleData.regionCode);

      if (!region) {
        throw new PricingValidationError(`Region with code ${ruleData.regionCode} not found`);
      }
    }

    return this.port.update(id, ruleData);
  }
}
