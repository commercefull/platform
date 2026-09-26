/**
 * CreatePricingRule Use Case
 *
 * Creates a pricing rule after validating required fields and that at least
 * one adjustment is provided.
 */

import { PricingRule, PricingRuleCreateProps } from '../../domain/pricingRule';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

interface PricingRuleCreatePort {
  create(data: PricingRuleCreateProps): Promise<PricingRule>;
}

export class CreatePricingRuleUseCase {
  constructor(private readonly rules: PricingRuleCreatePort) {}

  async execute(ruleData: PricingRuleCreateProps): Promise<PricingRule> {
    if (!ruleData.name || !ruleData.type || !ruleData.scope) {
      throw new PricingValidationError('Missing required fields: name, type, and scope are required');
    }

    if (!ruleData.adjustments || ruleData.adjustments.length === 0) {
      throw new PricingValidationError('At least one adjustment is required');
    }

    return this.rules.create(ruleData);
  }
}
