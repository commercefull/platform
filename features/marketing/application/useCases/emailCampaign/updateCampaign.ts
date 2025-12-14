/**
 * Update Email Campaign Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface UpdateCampaignInput {
  campaignId: string;
  name?: string;
  subject?: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  bodyHtml?: string;
  bodyText?: string;
  templateId?: string;
  segmentIds?: string[];
  tags?: string[];
}

export interface UpdateCampaignOutput {
  campaign: emailCampaignRepo.EmailCampaign;
}

export async function updateCampaign(input: UpdateCampaignInput): Promise<UpdateCampaignOutput> {
  // Fetch existing campaign
  const existing = await emailCampaignRepo.getCampaign(input.campaignId);
  if (!existing) {
    throw new Error('Campaign not found');
  }

  // Only allow updates to draft campaigns
  if (existing.status !== 'draft') {
    throw new Error('Can only update draft campaigns');
  }

  // Update campaign
  const campaign = await emailCampaignRepo.saveCampaign({
    emailCampaignId: input.campaignId,
    name: input.name ?? existing.name,
    subject: input.subject ?? existing.subject,
    preheader: input.preheader ?? existing.preheader,
    fromName: input.fromName ?? existing.fromName,
    fromEmail: input.fromEmail ?? existing.fromEmail,
    replyTo: input.replyTo ?? existing.replyTo,
    bodyHtml: input.bodyHtml ?? existing.bodyHtml,
    bodyText: input.bodyText ?? existing.bodyText,
    templateId: input.templateId ?? existing.templateId,
    segmentIds: input.segmentIds ?? existing.segmentIds,
    tags: input.tags ?? existing.tags
  });

  return { campaign };
}
