/**
 * Return Rule Service
 *
 * Evaluates return requests against return rules to determine:
 * - Whether the return is within the allowed window
 * - Restocking fees
 * - Return shipping cost
 * - Whether to auto-approve or require manual review
 * - Whether inspection is required
 * - Refund method
 *
 * Uses specificity-based resolution: product-scoped rules take priority over
 * category-scoped rules, which take priority over global rules.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic I.
 */

import { ReturnRule, type ReturnEvaluationContext, type ReturnRuleEvaluationResult } from '../entities/ReturnRule';

export class ReturnRuleService {
  /**
   * Evaluate a return request against a set of rules.
   * Returns the most specific applicable rule's verdict.
   */
  evaluate(rules: ReturnRule[], context: ReturnEvaluationContext): ReturnRuleEvaluationResult {
    const returnDate = context.returnDate ?? new Date();
    const daysSinceOrder = Math.floor((returnDate.getTime() - context.orderDate.getTime()) / (1000 * 60 * 60 * 24));

    // Find applicable rules, sorted by specificity (product > category > global) then priority
    const applicableRules = rules
      .filter(r => r.isApplicable(context))
      .sort((a, b) => {
        // Specificity: product (3) > category (2) > global (1)
        const aSpec = a.scope === 'product' ? 3 : a.scope === 'category' ? 2 : 1;
        const bSpec = b.scope === 'product' ? 3 : b.scope === 'category' ? 2 : 1;
        if (aSpec !== bSpec) return bSpec - aSpec;
        return b.priority - a.priority;
      });

    const applicableRule = applicableRules[0] ?? null;

    if (!applicableRule) {
      // No rule applies — default to conservative behavior
      return {
        applicableRule: null,
        isWithinWindow: daysSinceOrder <= 30, // Default 30-day window
        daysSinceOrder,
        restockingFeePercent: 0,
        restockingFeeFlat: 0,
        returnShippingCost: 0,
        customerPaysReturnShipping: true,
        autoApprove: false,
        requiresManualReview: true,
        requiresInspection: true,
        refundMethod: 'original',
      };
    }

    return {
      applicableRule,
      isWithinWindow: applicableRule.isWithinWindow(context),
      daysSinceOrder,
      restockingFeePercent: applicableRule.restockingFeePercent,
      restockingFeeFlat: applicableRule.restockingFeeFlat,
      returnShippingCost: applicableRule.returnShippingCost,
      customerPaysReturnShipping: applicableRule.customerPaysReturnShipping,
      autoApprove: applicableRule.autoApprove,
      requiresManualReview: applicableRule.requiresManualReview,
      requiresInspection: applicableRule.requiresInspection,
      refundMethod: applicableRule.refundMethod,
    };
  }

  /**
   * Compute the restocking fee for a given refund amount.
   */
  computeRestockingFee(result: ReturnRuleEvaluationResult, refundAmount: number): number {
    const percentFee = (refundAmount * result.restockingFeePercent) / 100;
    return Math.min(percentFee + result.restockingFeeFlat, refundAmount);
  }
}

export const returnRuleService = new ReturnRuleService();
