/**
 * Create Distribution Rule Use Case
 */
import * as fulfillmentRepo from '../../repos/fulfillmentRepo';

export interface CreateDistributionRuleInput {
  name: string;
  description?: string;
  distributionWarehouseId?: string;
  distributionShippingZoneId?: string;
  distributionShippingMethodId?: string;
  applicableCountries?: string[];
  applicableRegions?: string[];
  applicablePostalCodes?: string[];
  priority?: number;
  isActive?: boolean;
  isDefault?: boolean;
  createdBy?: string;
}

export interface CreateDistributionRuleOutput {
  success: boolean;
  rule?: { id: string; name: string; priority: number; isActive: boolean; isDefault: boolean };
  error?: string;
}

export class CreateDistributionRule {
  async execute(input: CreateDistributionRuleInput): Promise<CreateDistributionRuleOutput> {
    try {
      if (!input.name) {
        return { success: false, error: 'Name is required' };
      }

      let priority = input.priority;
      if (priority === undefined) {
        const rules = await fulfillmentRepo.findAllDistributionRules();
        priority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 1 : 1;
      }

      const rule = await fulfillmentRepo.createDistributionRule({
        name: input.name,
        description: input.description || null,
        distributionWarehouseId: input.distributionWarehouseId || null,
        distributionShippingZoneId: input.distributionShippingZoneId || null,
        distributionShippingMethodId: input.distributionShippingMethodId || null,
        applicableCountries: input.applicableCountries || [],
        applicableRegions: input.applicableRegions || [],
        applicablePostalCodes: input.applicablePostalCodes || [],
        priority,
        isActive: input.isActive !== false,
        isDefault: input.isDefault || false,
        createdBy: input.createdBy || null
      } as any);

      if (!rule) {
        return { success: false, error: 'Failed to create distribution rule' };
      }

      return {
        success: true,
        rule: {
          id: rule.distributionRuleId,
          name: rule.name,
          priority: rule.priority,
          isActive: rule.isActive,
          isDefault: rule.isDefault
        }
      };
    } catch (error) {
      console.error('CreateDistributionRule error:', error);
      return { success: false, error: 'Failed to create distribution rule' };
    }
  }
}

export const createDistributionRule = new CreateDistributionRule();
