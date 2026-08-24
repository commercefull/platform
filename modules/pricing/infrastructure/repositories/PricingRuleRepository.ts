/**
 * Consolidated Pricing Rule Repository
 *
 * Merges pricingRuleRepo, pricingRuleConditionRepo, pricingRuleAdjustmentRepo,
 * and currencyPriceRuleRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Pricing Rule (rule engine — rules, conditions, adjustments)
 */

import pricingRuleRepo from './pricingRuleRepo';
import { RuleConditionRepo } from './pricingRuleConditionRepo';
import { RuleAdjustmentRepo } from './pricingRuleAdjustmentRepo';
import { CurrencyPriceRuleRepo } from './currencyPriceRuleRepo';

// Re-export types for backward compatibility
export type { PricingRule, PricingRuleCreateProps, PricingRuleUpdateProps, PricingRuleStatus, PricingRuleType, PricingRuleScope, CurrencyPriceRule, CurrencyPriceRuleCreateProps, CurrencyPriceRuleUpdateProps } from '../../domain/pricingRule';
export type { RuleCondition, RuleConditionCreateParams, RuleConditionUpdateParams } from './pricingRuleConditionRepo';
export type { RuleAdjustment, RuleAdjustmentCreateParams, RuleAdjustmentUpdateParams, RuleAdjustmentType } from './pricingRuleAdjustmentRepo';

const ruleConditionRepo = new RuleConditionRepo();
const ruleAdjustmentRepo = new RuleAdjustmentRepo();
const currencyPriceRuleRepoInstance = new CurrencyPriceRuleRepo();

class PricingRuleRepository {
  // Pricing Rules — delegate to pricingRuleRepo
  readonly rules = pricingRuleRepo;
  // Rule Conditions
  readonly conditions = ruleConditionRepo;
  // Rule Adjustments
  readonly adjustments = ruleAdjustmentRepo;
  // Currency Price Rules
  readonly currencyPriceRules = currencyPriceRuleRepoInstance;

  // Delegate commonly used methods directly
  async findById(id: string) {
    return pricingRuleRepo.findById(id);
  }
  async findActiveRules(productId?: string, categoryId?: string, customerId?: string, customerGroupIds?: string[]) {
    return pricingRuleRepo.findActiveRules(productId, categoryId, customerId, customerGroupIds);
  }
  async create(params: Parameters<typeof pricingRuleRepo.create>[0]) {
    return pricingRuleRepo.create(params);
  }
  async update(id: string, params: Parameters<typeof pricingRuleRepo.update>[1]) {
    return pricingRuleRepo.update(id, params);
  }
  async delete(id: string) {
    return pricingRuleRepo.delete(id);
  }
  async updateStatus(id: string, isActive: boolean) {
    return pricingRuleRepo.updateStatus(id, isActive);
  }
}

export default new PricingRuleRepository();
