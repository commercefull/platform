import { query, queryOne } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";
import { 
  CurrencyPriceRule, 
  CurrencyPriceRuleCreateProps, 
  CurrencyPriceRuleUpdateProps,
  PricingRuleStatus,
  PricingRuleType
} from "../domain/pricingRule";
import pricingRuleRepo from "./pricingRuleRepo";

export class CurrencyPriceRuleRepo {
  /**
   * Find currency price rules by currency code
   */
  async findByCurrencyCode(currencyCode: string, activeOnly: boolean = false): Promise<CurrencyPriceRule[]> {
    // We'll use the generic pricing rule repo's findAllRules method to find rules
    // that match our criteria for currency price rules
    const rules = await pricingRuleRepo.findAllRules({
      type: PricingRuleType.CURRENCY_CONVERSION,
      activeOnly
    });
    
    // Filter the rules by currency code from the metadata
    const filteredRules = rules.filter(rule => {
      return rule.metadata && rule.metadata.currencyCode === currencyCode;
    });
    
    // Convert from base PricingRule to CurrencyPriceRule
    return filteredRules.map(rule => this.transformToCurrencyPriceRule(rule));
  }

  /**
   * Find currency price rules by region code
   */
  async findByRegionCode(regionCode: string, activeOnly: boolean = false): Promise<CurrencyPriceRule[]> {
    const rules = await pricingRuleRepo.findAllRules({
      type: PricingRuleType.CURRENCY_CONVERSION,
      activeOnly
    });
    
    // Filter the rules by region code from the metadata
    const filteredRules = rules.filter(rule => {
      return rule.metadata && rule.metadata.regionCode === regionCode;
    });
    
    return filteredRules.map(rule => this.transformToCurrencyPriceRule(rule));
  }

  /**
   * Create a new currency price rule
   */
  async create(data: CurrencyPriceRuleCreateProps): Promise<CurrencyPriceRule> {
    // Store currency-specific fields in the metadata and directly on the rule
    const metadata = {
      currencyCode: data.currencyCode,
      regionCode: data.regionCode,
      minOrderValue: data.minOrderValue,
      maxOrderValue: data.maxOrderValue
    };
    
    // Create the base pricing rule with currencyCode stored directly
    const pricingRuleData = {
      ...data,
      ruleType: 'percentage' as const,
      currencyCode: data.currencyCode,
      regionCode: data.regionCode,
      metadata
    };
    
    const rule = await pricingRuleRepo.create(pricingRuleData as any);
    
    return this.transformToCurrencyPriceRule(rule);
  }

  /**
   * Update a currency price rule
   */
  async update(id: string, data: CurrencyPriceRuleUpdateProps): Promise<CurrencyPriceRule> {
    // First, get the existing rule to merge the metadata properly
    const existingRule = await pricingRuleRepo.findById(id);
    if (!existingRule) {
      throw new Error(`Currency price rule with ID ${id} not found`);
    }
    
    // Create updated metadata
    const metadata = {
      ...(existingRule.metadata || {}),
      ...(data.currencyCode ? { currencyCode: data.currencyCode } : {}),
      ...(data.regionCode !== undefined ? { regionCode: data.regionCode } : {}),
      ...(data.minOrderValue !== undefined ? { minOrderValue: data.minOrderValue } : {}),
      ...(data.maxOrderValue !== undefined ? { maxOrderValue: data.maxOrderValue } : {})
    };
    
    // Update the rule - remove type/ruleType to avoid column issues
    const { type, ruleType, ...updateData } = data as any;
    const updatedRule = await pricingRuleRepo.update(id, {
      ...updateData,
      metadata
    });
    
    return this.transformToCurrencyPriceRule(updatedRule);
  }

  /**
   * Delete a currency price rule
   */
  async delete(id: string): Promise<boolean> {
    return pricingRuleRepo.delete(id);
  }

  /**
   * Get a single currency price rule by ID
   */
  async findById(id: string): Promise<CurrencyPriceRule | null> {
    const rule = await pricingRuleRepo.findById(id);
    if (!rule) {
      return null;
    }
    
    // Check if this is a currency price rule by checking currencyCode or metadata
    const hasCurrencyCode = (rule as any).currencyCode || 
      ((rule as any).metadata && (rule as any).metadata.currencyCode);
    
    if (!hasCurrencyCode) {
      return null;
    }
    
    return this.transformToCurrencyPriceRule(rule);
  }

  /**
   * Update status of a currency price rule
   */
  async updateStatus(id: string, status: PricingRuleStatus): Promise<CurrencyPriceRule> {
    const isActive = status === PricingRuleStatus.ACTIVE;
    const updatedRule = await pricingRuleRepo.updateStatus(id, isActive);
    
    if (updatedRule.type !== PricingRuleType.CURRENCY_CONVERSION) {
      throw new Error(`Rule with ID ${id} is not a currency price rule`);
    }
    
    return this.transformToCurrencyPriceRule(updatedRule);
  }

  /**
   * Helper method to transform a PricingRule to CurrencyPriceRule
   */
  private transformToCurrencyPriceRule(rule: any): CurrencyPriceRule {
    if (!rule) return null as any;
    
    // Extract currency-specific properties from direct fields or metadata
    const metadata = rule.metadata || {};
    
    return {
      ...rule,
      currencyCode: rule.currencyCode || metadata.currencyCode || '',
      regionCode: rule.regionCode || metadata.regionCode,
      minOrderValue: metadata.minOrderValue,
      maxOrderValue: metadata.maxOrderValue
    };
  }
}

export default new CurrencyPriceRuleRepo();
