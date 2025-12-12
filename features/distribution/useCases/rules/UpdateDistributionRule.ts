/**
 * Update Distribution Rule Use Case
 */
import * as fulfillmentRepo from '../../repos/fulfillmentRepo';

export interface UpdateDistributionRuleInput {
  id: string;
  name?: string;
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
}

export interface UpdateDistributionRuleOutput {
  success: boolean;
  rule?: { id: string; name: string; priority: number; isActive: boolean; isDefault: boolean };
  error?: string;
}

export class UpdateDistributionRule {
  async execute(input: UpdateDistributionRuleInput): Promise<UpdateDistributionRuleOutput> {
    try {
      const existingRule = await fulfillmentRepo.findDistributionRuleById(input.id);
      if (!existingRule) {
        return { success: false, error: 'Distribution rule not found' };
      }

      const { id, ...updateData } = input;
      const updatedRule = await fulfillmentRepo.updateDistributionRule(id, updateData as any);

      if (!updatedRule) {
        return { success: false, error: 'Failed to update distribution rule' };
      }

      return {
        success: true,
        rule: {
          id: updatedRule.distributionRuleId,
          name: updatedRule.name,
          priority: updatedRule.priority,
          isActive: updatedRule.isActive,
          isDefault: updatedRule.isDefault
        }
      };
    } catch (error) {
      console.error('UpdateDistributionRule error:', error);
      return { success: false, error: 'Failed to update distribution rule' };
    }
  }
}

export const updateDistributionRule = new UpdateDistributionRule();
