/**
 * SendEmailCampaign Use Case
 *
 * Enqueues delivery to all recipients in marketingEmailCampaignRecipient with `pending` status,
 * then marks the campaign as `sending`.
 *
 * Validates: Requirements 6.3, 6.4
 */

import * as emailCampaignRepo from '../../infrastructure/repositories/emailCampaignRepo';
import * as campaignRecipientRepo from '../../infrastructure/repositories/campaignRecipientRepo';

// ============================================================================
// Command
// ============================================================================

export class SendEmailCampaignCommand {
  constructor(
    public readonly campaignId: string,
    public readonly recipients: Array<{ customerId?: string; email: string }>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface SendEmailCampaignResponse {
  campaignId: string;
  status: string;
  recipientCount: number;
}

// ============================================================================
// Use Case
// ============================================================================

export class SendEmailCampaignUseCase {
  constructor(
    private readonly campaignRepo: typeof emailCampaignRepo = emailCampaignRepo,
    private readonly recipientRepo: typeof campaignRecipientRepo = campaignRecipientRepo,
  ) {}

  async execute(command: SendEmailCampaignCommand): Promise<SendEmailCampaignResponse> {
    const campaign = await this.campaignRepo.findById(command.campaignId);
    if (!campaign) throw new Error(`Campaign ${command.campaignId} not found`);

    if (campaign.status === 'sent') {
      throw new Error('Campaign has already been sent');
    }

    if (!command.recipients || command.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    // Bulk-insert recipients with pending status (ON CONFLICT DO NOTHING for idempotency)
    await this.recipientRepo.bulkCreate(command.campaignId, command.recipients);

    // Mark campaign as sending
    await this.campaignRepo.updateStatus(command.campaignId, 'sending');

    return {
      campaignId: command.campaignId,
      status: 'sending',
      recipientCount: command.recipients.length,
    };
  }
}
