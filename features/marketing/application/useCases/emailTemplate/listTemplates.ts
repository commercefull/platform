/**
 * List Email Templates Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface ListTemplatesInput {
  merchantId: string;
  category?: string;
  isActive?: boolean;
}

export interface ListTemplatesOutput {
  templates: emailCampaignRepo.EmailTemplate[];
}

export async function listTemplates(input: ListTemplatesInput): Promise<ListTemplatesOutput> {
  const templates = await emailCampaignRepo.getTemplatesByMerchant(
    input.merchantId,
    { 
      category: input.category, 
      isActive: input.isActive 
    }
  );

  return { templates };
}
