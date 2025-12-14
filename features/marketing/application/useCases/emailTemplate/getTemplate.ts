/**
 * Get Email Template Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface GetTemplateInput {
  templateId: string;
}

export interface GetTemplateOutput {
  template: emailCampaignRepo.EmailTemplate;
}

export async function getTemplate(input: GetTemplateInput): Promise<GetTemplateOutput> {
  const template = await emailCampaignRepo.getTemplate(input.templateId);
  
  if (!template) {
    throw new Error('Template not found');
  }

  return { template };
}
