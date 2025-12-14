/**
 * Manage Campaign Recipients Use Case
 */

import * as emailCampaignRepo from '../../../repos/emailCampaignRepo';

export interface AddRecipientsInput {
  campaignId: string;
  recipients: Array<{
    customerId?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    variant?: string;
  }>;
}

export interface AddRecipientsOutput {
  added: number;
}

export async function addRecipients(input: AddRecipientsInput): Promise<AddRecipientsOutput> {
  // Validate campaign exists
  const campaign = await emailCampaignRepo.getCampaign(input.campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Only allow adding recipients to draft or scheduled campaigns
  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    throw new Error('Can only add recipients to draft or scheduled campaigns');
  }

  // Validate recipients
  if (!input.recipients || input.recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }

  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const recipient of input.recipients) {
    if (!recipient.email || !emailRegex.test(recipient.email)) {
      throw new Error(`Invalid email address: ${recipient.email}`);
    }
  }

  const count = await emailCampaignRepo.addRecipients(input.campaignId, input.recipients);

  return { added: count };
}

export interface ListRecipientsInput {
  campaignId: string;
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained' | 'failed';
  limit?: number;
  offset?: number;
}

export interface ListRecipientsOutput {
  data: emailCampaignRepo.EmailCampaignRecipient[];
  total: number;
}

export async function listRecipients(input: ListRecipientsInput): Promise<ListRecipientsOutput> {
  const result = await emailCampaignRepo.getRecipients(
    input.campaignId,
    { status: input.status },
    { limit: input.limit || 100, offset: input.offset || 0 }
  );

  return result;
}
