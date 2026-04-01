/**
 * CreateEmailCampaign Use Case
 *
 * Creates a marketing email campaign record and associates an email template.
 *
 * Validates: Requirements 6.1, 6.2
 */

import * as emailCampaignRepo from '../../infrastructure/repositories/emailCampaignRepo';
import * as emailTemplateRepo from '../../infrastructure/repositories/emailTemplateRepo';

// ============================================================================
// Command
// ============================================================================

export class CreateEmailCampaignCommand {
  constructor(
    public readonly name: string,
    public readonly subject: string,
    public readonly merchantId?: string,
    public readonly templateId?: string,
    public readonly scheduledAt?: Date,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateEmailCampaignResponse {
  marketingEmailCampaignId: string;
  name: string;
  subject: string;
  status: string;
  templateId?: string;
  scheduledAt?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateEmailCampaignUseCase {
  constructor(
    private readonly campaignRepo: typeof emailCampaignRepo = emailCampaignRepo,
    private readonly tmplRepo: typeof emailTemplateRepo = emailTemplateRepo,
  ) {}

  async execute(command: CreateEmailCampaignCommand): Promise<CreateEmailCampaignResponse> {
    if (!command.name) throw new Error('Campaign name is required');
    if (!command.subject) throw new Error('Campaign subject is required');

    if (command.templateId) {
      const template = await this.tmplRepo.findById(command.templateId);
      if (!template) throw new Error(`Email template ${command.templateId} not found`);
    }

    const campaign = await this.campaignRepo.create({
      merchantId: command.merchantId,
      name: command.name,
      subject: command.subject,
      templateId: command.templateId,
      status: 'draft',
      scheduledAt: command.scheduledAt,
      sentAt: undefined,
    });

    if (!campaign) throw new Error('Failed to create email campaign');

    return {
      marketingEmailCampaignId: campaign.marketingEmailCampaignId,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      templateId: campaign.templateId,
      scheduledAt: campaign.scheduledAt?.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
    };
  }
}
