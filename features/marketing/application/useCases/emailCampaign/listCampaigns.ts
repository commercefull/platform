/**
 * List Email Campaigns Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface ListCampaignsInput {
  merchantId: string;
  status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  campaignType?: 'regular' | 'automated' | 'ab_test' | 'transactional';
  limit?: number;
  offset?: number;
}

export interface ListCampaignsOutput {
  data: emailCampaignRepo.EmailCampaign[];
  total: number;
}

export async function listCampaigns(input: ListCampaignsInput): Promise<ListCampaignsOutput> {
  const result = await emailCampaignRepo.getCampaignsByMerchant(
    input.merchantId,
    { 
      status: input.status, 
      campaignType: input.campaignType 
    },
    { 
      limit: input.limit || 20, 
      offset: input.offset || 0 
    }
  );

  return result;
}
