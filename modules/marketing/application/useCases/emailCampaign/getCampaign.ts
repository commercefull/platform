/**
 * Get Email Campaign Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface GetCampaignInput {
  campaignId: string;
}

export interface GetCampaignOutput {
  campaign: emailCampaignRepo.EmailCampaign;
}

export async function getCampaign(input: GetCampaignInput): Promise<GetCampaignOutput> {
  const campaign = await emailCampaignRepo.getCampaign(input.campaignId);
  
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  return { campaign };
}
