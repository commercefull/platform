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
  { ruleId: string; productId: string; context?: PriceContext } | { rule: PricingRule; context: PriceContext };

export class CalculateRuleImpactUseCase {
  constructor(
    private readonly pricingRules: PricingRuleQueryPort,
    private readonly calculatePrice: Pick<CalculatePriceUseCase, 'execute'>,
  ) {}

  async execute(input: CalculateRuleImpactInput): Promise<PricingRuleImpact> {
    const { rule, productId, context } = await this.resolveRuleAndProduct(input);
    const ruleId = rule.id ?? rule.pricingRuleId;

    // Calculate price without the rule
    const beforeRule = await this.calculatePrice.execute({
      ...context,
      productId,
      excludeRuleIds: ruleId ? [ruleId] : [],
    });

    // Calculate price with only this rule applied
    const priceAfterRule = applyAdjustments(beforeRule.originalPriceCents, rule.adjustments, context.currencyCode ?? 'USD').priceCents;
    const afterRule = this.buildAfterRuleResult(beforeRule, rule, priceAfterRule);

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

  private async resolveRuleAndProduct(
    input: CalculateRuleImpactInput,
  ): Promise<{ rule: PricingRule; productId: string; context: PriceContext }> {
    if ('ruleId' in input) {
      const fetchedRule = await this.pricingRules.findById(input.ruleId);
      if (!fetchedRule) {
        throw new PricingRuleNotFoundError(input.ruleId);
      }
      return { rule: fetchedRule, productId: input.productId, context: input.context ?? {} };
    }

    const { rule, context } = input;

    // For this variant we need to get the product from the context
    if (!context.productIds || context.productIds.length === 0) {
      throw new PricingValidationError('Product IDs must be specified in context when using rule object overload');
    }

    // Use the first product ID from the context
    return { rule, productId: context.productIds[0], context };
  }

  private buildAfterRuleResult(beforeRule: PricingResult, rule: PricingRule, priceAfterRule: number): PricingResult {
    const firstAdjustment = rule.adjustments && rule.adjustments.length > 0 ? rule.adjustments[0] : undefined;
    return {
      originalPriceCents: beforeRule.originalPriceCents,
      finalPriceCents: priceAfterRule,
      appliedRules: [
        {
          ruleId: rule.id,
          ruleName: rule.name,
          adjustmentType: firstAdjustment?.type || PricingAdjustmentType.FIXED,
          adjustmentValue: firstAdjustment?.value || 0,
          impact: beforeRule.originalPriceCents - priceAfterRule,
        },
      ],
      currency: beforeRule.currency,
      originalCurrency: beforeRule.originalCurrency,
      exchangeRate: beforeRule.exchangeRate,
    };
  }
}
