/**
 * Pricing Rule Query Ports
 *
 * Read-side repository contracts for the pricing calculation pipeline.
 * Implementations live in `infrastructure/repositories/` and are injected
 * at the composition root (`application/wired.ts`).
 */

import { CurrencyPriceRule, PricingRule } from '../pricingRule';

export interface PricingRuleQueryPort {
  /** Active rules for a product/category/customer, with conditions and adjustments loaded. */
  findActiveRules(
    productId?: string,
    categoryId?: string,
    customerId?: string,
    customerGroupIds?: string[],
  ): Promise<PricingRule[]>;

  findById(ruleId: string): Promise<PricingRule | null>;
}

export interface CurrencyPriceRuleQueryPort {
  findByCurrencyCode(currencyCode: string, activeOnly?: boolean): Promise<CurrencyPriceRule[]>;
}
