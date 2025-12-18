/**
 * Create Email Template Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface CreateTemplateInput {
  merchantId: string;
  name: string;
  slug?: string;
  category?: string;
  description?: string;
  subject?: string;
  preheader?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables?: string[];
  thumbnailUrl?: string;
}

export interface CreateTemplateOutput {
  template: emailCampaignRepo.EmailTemplate;
}

export async function createTemplate(input: CreateTemplateInput): Promise<CreateTemplateOutput> {
  // Validate required fields
  if (!input.name?.trim()) {
    throw new Error('Template name is required');
  }

  // Create template
  const template = await emailCampaignRepo.saveTemplate({
    merchantId: input.merchantId,
    name: input.name.trim(),
    slug: input.slug,
    category: input.category || 'custom',
    description: input.description,
    subject: input.subject,
    preheader: input.preheader,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    variables: input.variables || [],
    thumbnailUrl: input.thumbnailUrl
  });

  return { template };
}
