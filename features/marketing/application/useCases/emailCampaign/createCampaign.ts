/**
 * Create Email Campaign Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface CreateCampaignInput {
  merchantId: string;
  name: string;
  subject: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  bodyHtml?: string;
  bodyText?: string;
  campaignType?: 'regular' | 'automated' | 'ab_test' | 'transactional';
  templateId?: string;
  segmentIds?: string[];
  tags?: string[];
  scheduledAt?: Date;
}

export interface CreateCampaignOutput {
  campaign: emailCampaignRepo.EmailCampaign;
}

export async function createCampaign(input: CreateCampaignInput): Promise<CreateCampaignOutput> {
  // Validate required fields
  if (!input.name?.trim()) {
    throw new Error('Campaign name is required');
  }
  if (!input.subject?.trim()) {
    throw new Error('Campaign subject is required');
  }

  // Create campaign
  const campaign = await emailCampaignRepo.saveCampaign({
    merchantId: input.merchantId,
    name: input.name.trim(),
    subject: input.subject.trim(),
    preheader: input.preheader,
    fromName: input.fromName,
    fromEmail: input.fromEmail,
    replyTo: input.replyTo,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    campaignType: input.campaignType || 'regular',
    templateId: input.templateId,
    segmentIds: input.segmentIds || [],
    tags: input.tags || [],
    scheduledAt: input.scheduledAt
  });

  // TODO: Emit domain event when marketing events are registered
  // eventBus.emit('marketing.campaign.created', { ... });

  return { campaign };
}
