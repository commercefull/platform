/**
 * Inventory Allocation Rule Service
 *
 * Evaluates allocation rules to determine the effective allocation strategy,
 * reservation policy, and available quantity for an order.
 *
 * Uses specificity-based resolution: product > category > pool > global.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic J.
 */

import {
  InventoryAllocationRule,
  type AllocationEvaluationContext,
  type AllocationRuleEvaluationResult,
  type AllocationStrategy,
  type ReservationPolicy,
} from '../entities/InventoryAllocationRule';

export class InventoryAllocationRuleService {
  /**
   * Evaluate allocation rules against a context.
   * Returns the most specific applicable rule's verdict.
   */
  evaluate(rules: InventoryAllocationRule[], context: AllocationEvaluationContext): AllocationRuleEvaluationResult {
    // Find applicable rules, sorted by specificity (product > category > pool > global) then priority
    const applicableRules = rules
      .filter(r => r.isApplicable(context))
      .sort((a, b) => {
        const aSpec = a.scope === 'product' ? 4 : a.scope === 'category' ? 3 : a.scope === 'pool' ? 2 : 1;
        const bSpec = b.scope === 'product' ? 4 : b.scope === 'category' ? 3 : b.scope === 'pool' ? 2 : 1;
        if (aSpec !== bSpec) return bSpec - aSpec;
        return b.priority - a.priority;
      });

    const applicableRule = applicableRules[0] ?? null;

    if (!applicableRule) {
      // No rule applies — default to conservative behavior
      const availableStock = context.availableStock ?? 0;
      return {
        applicableRule: null,
        allocationStrategy: 'fifo' as AllocationStrategy,
        reservationPolicy: 'immediate' as ReservationPolicy,
        lowStockThreshold: 0,
        oversellBuffer: 0,
        allowBackorder: false,
        allowOversell: false,
        maxAllocationPerOrder: 0,
        effectiveAvailable: availableStock,
      };
    }

    // Compute effective available stock considering oversell buffer and backorder
    const availableStock = context.availableStock ?? 0;
    const effectiveAvailable = applicableRule.allowOversell ? availableStock + applicableRule.oversellBuffer : availableStock;

    return {
      applicableRule,
      allocationStrategy: applicableRule.allocationStrategy,
      reservationPolicy: applicableRule.reservationPolicy,
      lowStockThreshold: applicableRule.lowStockThreshold,
      oversellBuffer: applicableRule.oversellBuffer,
      allowBackorder: applicableRule.allowBackorder,
      allowOversell: applicableRule.allowOversell,
      maxAllocationPerOrder: applicableRule.maxAllocationPerOrder,
      effectiveAvailable,
    };
  }

  /**
   * Determine if an allocation request can be fulfilled given the rule verdict.
   */
  canAllocate(result: AllocationRuleEvaluationResult, requestedQuantity: number): boolean {
    if (result.maxAllocationPerOrder > 0 && requestedQuantity > result.maxAllocationPerOrder) {
      return false;
    }
    if (result.effectiveAvailable >= requestedQuantity) return true;
    return result.allowBackorder;
  }
}

export const inventoryAllocationRuleService = new InventoryAllocationRuleService();
