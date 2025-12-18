/**
 * Delete Email Template Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface DeleteTemplateInput {
  templateId: string;
}

export async function deleteTemplate(input: DeleteTemplateInput): Promise<void> {
  // Fetch existing template
  const existing = await emailCampaignRepo.getTemplate(input.templateId);
  if (!existing) {
    throw new Error('Template not found');
  }

  // Check if template is a default template
  if (existing.isDefault) {
    throw new Error('Cannot delete default templates');
  }

  await emailCampaignRepo.deleteTemplate(input.templateId);
}
