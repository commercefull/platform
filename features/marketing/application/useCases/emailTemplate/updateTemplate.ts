/**
 * Update Email Template Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface UpdateTemplateInput {
  templateId: string;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  subject?: string;
  preheader?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables?: string[];
  thumbnailUrl?: string;
  isActive?: boolean;
}

export interface UpdateTemplateOutput {
  template: emailCampaignRepo.EmailTemplate;
}

export async function updateTemplate(input: UpdateTemplateInput): Promise<UpdateTemplateOutput> {
  // Fetch existing template
  const existing = await emailCampaignRepo.getTemplate(input.templateId);
  if (!existing) {
    throw new Error('Template not found');
  }

  // Update template
  const template = await emailCampaignRepo.saveTemplate({
    emailTemplateId: input.templateId,
    name: input.name ?? existing.name,
    slug: input.slug ?? existing.slug,
    category: input.category ?? existing.category,
    description: input.description ?? existing.description,
    subject: input.subject ?? existing.subject,
    preheader: input.preheader ?? existing.preheader,
    bodyHtml: input.bodyHtml ?? existing.bodyHtml,
    bodyText: input.bodyText ?? existing.bodyText,
    variables: input.variables ?? existing.variables,
    thumbnailUrl: input.thumbnailUrl ?? existing.thumbnailUrl,
    isActive: input.isActive ?? existing.isActive
  });

  return { template };
}
