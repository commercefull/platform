/**
 * Delete Email Campaign Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface DeleteCampaignInput {
  campaignId: string;
}

export async function deleteCampaign(input: DeleteCampaignInput): Promise<void> {
  // Fetch existing campaign
  const existing = await emailCampaignRepo.getCampaign(input.campaignId);
  if (!existing) {
    throw new Error('Campaign not found');
  }

  // Cannot delete campaigns that are currently sending
  if (existing.status === 'sending') {
    throw new Error('Cannot delete a campaign that is currently sending');
  }

  await emailCampaignRepo.deleteCampaign(input.campaignId);
}
