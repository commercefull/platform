/**
 * Delete Distribution Rule Use Case
 */
import * as fulfillmentRepo from '../../repos/fulfillmentRepo';

export interface DeleteDistributionRuleInput {
  id: string;
}

export interface DeleteDistributionRuleOutput {
  success: boolean;
  error?: string;
}

export class DeleteDistributionRule {
  async execute(input: DeleteDistributionRuleInput): Promise<DeleteDistributionRuleOutput> {
    try {
      const existingRule = await fulfillmentRepo.findDistributionRuleById(input.id);
      if (!existingRule) {
        return { success: false, error: 'Distribution rule not found' };
      }

      const deleted = await fulfillmentRepo.deleteDistributionRule(input.id);
      if (!deleted) {
        return { success: false, error: 'Failed to delete distribution rule' };
      }

      return { success: true };
    } catch (error) {
      console.error('DeleteDistributionRule error:', error);
      return { success: false, error: 'Failed to delete distribution rule' };
    }
  }
}

export const deleteDistributionRule = new DeleteDistributionRule();
