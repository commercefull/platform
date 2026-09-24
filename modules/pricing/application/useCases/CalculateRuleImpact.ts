/**
 * CalculateRuleImpact Use Case
 *
 * Calculates the price impact of a pricing rule on a product by comparing
 * the contextual price with and without the rule applied.
 */

import { PricingRuleQueryPort } from '../../domain/repositories/PricingRuleQueryRepository';
import { applyAdjustments } from '../../domain/services/PricingRuleEvaluator';
import { PriceContext, PricingAdjustmentType, PricingResult, PricingRule } from '../../domain/pricingRule';
import { PricingRuleNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';
import { CalculatePriceUseCase } from './CalculatePrice';

// Interface for pricing rule impact calculations
export interface PricingRuleImpact {
  beforeRule: PricingResult;
  afterRule: PricingResult;
  impact: number;
  percentageImpact: number;
}

/** Identify the rule by ID (fetched) or pass the rule object directly. */
export type CalculateRuleImpactInput =
  | { ruleId: string; productId: string; context?: PriceContext }
  | { rule: PricingRule; context: PriceContext };

export class CalculateRuleImpactUseCase {
  constructor(
    private readonly pricingRules: PricingRuleQueryPort,
    private readonly calculatePrice: Pick<CalculatePriceUseCase, 'execute'>,
  ) {}

  async execute(input: CalculateRuleImpactInput): Promise<PricingRuleImpact> {
    let rule: PricingRule;
    let productId: string;
    let context: PriceContext;

    if ('ruleId' in input) {
      const fetchedRule = await this.pricingRules.findById(input.ruleId);
      if (!fetchedRule) {
        throw new PricingRuleNotFoundError(input.ruleId);
      }
      rule = fetchedRule;
      productId = input.productId;
      context = input.context ?? {};
    } else {
      rule = input.rule;
      context = input.context;

      // For this variant we need to get the product from the context
      if (!context.productIds || context.productIds.length === 0) {
        throw new PricingValidationError('Product IDs must be specified in context when using rule object overload');
      }

      // Use the first product ID from the context
      productId = context.productIds[0];
    }

    const ruleId = rule.id ?? rule.pricingRuleId;

    // Calculate price without the rule
    const beforeRule = await this.calculatePrice.execute({
      ...context,
      productId,
      excludeRuleIds: ruleId ? [ruleId] : [],
    });

    // Calculate price with only this rule applied
    const priceAfterRule = applyAdjustments(beforeRule.originalPriceCents, rule.adjustments).priceCents;

    // Create the afterRule result
    const afterRule: PricingResult = {
      originalPriceCents: beforeRule.originalPriceCents,
      finalPriceCents: priceAfterRule,
      appliedRules: [
        {
          ruleId: rule.id,
          ruleName: rule.name,
          adjustmentType:
            rule.adjustments && rule.adjustments.length > 0
              ? rule.adjustments[0]?.type || PricingAdjustmentType.FIXED
              : PricingAdjustmentType.FIXED,
          adjustmentValue: rule.adjustments && rule.adjustments.length > 0 ? rule.adjustments[0]?.value || 0 : 0,
          impact: beforeRule.originalPriceCents - priceAfterRule,
        },
      ],
      currency: beforeRule.currency,
      originalCurrency: beforeRule.originalCurrency,
      exchangeRate: beforeRule.exchangeRate,
    };

    // Calculate impact metrics
    const impact = beforeRule.originalPriceCents - priceAfterRule;
    const percentageImpact = beforeRule.originalPriceCents === 0 ? 0 : (impact / beforeRule.originalPriceCents) * 100;

    return {
      beforeRule,
      afterRule,
      impact,
      percentageImpact,
    };
  }
}
