/**
 * Email Campaign Entity
 * Represents a marketing email campaign
 */

import { generateUUID } from '../../../../libs/uuid';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
export type CampaignType = 'regular' | 'automated' | 'ab_test' | 'transactional';

export interface EmailCampaignProps {
  emailCampaignId: string;
  merchantId?: string;
  name: string;
  subject: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  bodyHtml?: string;
  bodyText?: string;
  status: CampaignStatus;
  campaignType: CampaignType;
  templateId?: string;
  segmentIds: string[];
  tags: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  uniqueOpenCount: number;
  clickCount: number;
  uniqueClickCount: number;
  bounceCount: number;
  softBounceCount: number;
  hardBounceCount: number;
  unsubscribeCount: number;
  complaintCount: number;
  revenue: number;
  conversionCount: number;
  openRate?: number;
  clickRate?: number;
  abTestConfig?: Record<string, any>;
  winningVariant?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class EmailCampaign {
  private constructor(private props: EmailCampaignProps) {}

  static create(props: {
    merchantId?: string;
    name: string;
    subject: string;
    preheader?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    bodyHtml?: string;
    bodyText?: string;
    campaignType?: CampaignType;
    templateId?: string;
    segmentIds?: string[];
    tags?: string[];
    scheduledAt?: Date;
  }): EmailCampaign {
    const now = new Date();
    return new EmailCampaign({
      emailCampaignId: generateUUID(),
      merchantId: props.merchantId,
      name: props.name,
      subject: props.subject,
      preheader: props.preheader,
      fromName: props.fromName,
      fromEmail: props.fromEmail,
      replyTo: props.replyTo,
      bodyHtml: props.bodyHtml,
      bodyText: props.bodyText,
      status: 'draft',
      campaignType: props.campaignType || 'regular',
      templateId: props.templateId,
      segmentIds: props.segmentIds || [],
      tags: props.tags || [],
      scheduledAt: props.scheduledAt,
      sentAt: undefined,
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      openCount: 0,
      uniqueOpenCount: 0,
      clickCount: 0,
      uniqueClickCount: 0,
      bounceCount: 0,
      softBounceCount: 0,
      hardBounceCount: 0,
      unsubscribeCount: 0,
      complaintCount: 0,
      revenue: 0,
      conversionCount: 0,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: EmailCampaignProps): EmailCampaign {
    return new EmailCampaign(props);
  }

  // Getters
  get emailCampaignId(): string { return this.props.emailCampaignId; }
  get merchantId(): string | undefined { return this.props.merchantId; }
  get name(): string { return this.props.name; }
  get subject(): string { return this.props.subject; }
  get preheader(): string | undefined { return this.props.preheader; }
  get fromName(): string | undefined { return this.props.fromName; }
  get fromEmail(): string | undefined { return this.props.fromEmail; }
  get replyTo(): string | undefined { return this.props.replyTo; }
  get bodyHtml(): string | undefined { return this.props.bodyHtml; }
  get bodyText(): string | undefined { return this.props.bodyText; }
  get status(): CampaignStatus { return this.props.status; }
  get campaignType(): CampaignType { return this.props.campaignType; }
  get templateId(): string | undefined { return this.props.templateId; }
  get segmentIds(): string[] { return this.props.segmentIds; }
  get tags(): string[] { return this.props.tags; }
  get scheduledAt(): Date | undefined { return this.props.scheduledAt; }
  get sentAt(): Date | undefined { return this.props.sentAt; }
  get totalRecipients(): number { return this.props.totalRecipients; }
  get sentCount(): number { return this.props.sentCount; }
  get deliveredCount(): number { return this.props.deliveredCount; }
  get openCount(): number { return this.props.openCount; }
  get uniqueOpenCount(): number { return this.props.uniqueOpenCount; }
  get clickCount(): number { return this.props.clickCount; }
  get uniqueClickCount(): number { return this.props.uniqueClickCount; }
  get bounceCount(): number { return this.props.bounceCount; }
  get unsubscribeCount(): number { return this.props.unsubscribeCount; }
  get revenue(): number { return this.props.revenue; }
  get conversionCount(): number { return this.props.conversionCount; }
  get openRate(): number | undefined { return this.props.openRate; }
  get clickRate(): number | undefined { return this.props.clickRate; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  updateContent(content: {
    name?: string;
    subject?: string;
    preheader?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    bodyHtml?: string;
    bodyText?: string;
  }): void {
    if (this.props.status !== 'draft') {
      throw new Error('Can only update content of draft campaigns');
    }
    if (content.name) this.props.name = content.name;
    if (content.subject) this.props.subject = content.subject;
    if (content.preheader !== undefined) this.props.preheader = content.preheader;
    if (content.fromName !== undefined) this.props.fromName = content.fromName;
    if (content.fromEmail !== undefined) this.props.fromEmail = content.fromEmail;
    if (content.replyTo !== undefined) this.props.replyTo = content.replyTo;
    if (content.bodyHtml !== undefined) this.props.bodyHtml = content.bodyHtml;
    if (content.bodyText !== undefined) this.props.bodyText = content.bodyText;
    this.props.updatedAt = new Date();
  }

  schedule(scheduledAt: Date): void {
    if (this.props.status !== 'draft') {
      throw new Error('Can only schedule draft campaigns');
    }
    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }
    this.props.scheduledAt = scheduledAt;
    this.props.status = 'scheduled';
    this.props.updatedAt = new Date();
  }

  startSending(totalRecipients: number): void {
    if (this.props.status !== 'scheduled' && this.props.status !== 'draft') {
      throw new Error('Campaign must be scheduled or draft to start sending');
    }
    this.props.status = 'sending';
    this.props.totalRecipients = totalRecipients;
    this.props.sentAt = new Date();
    this.props.updatedAt = new Date();
  }

  completeSending(): void {
    if (this.props.status !== 'sending') {
      throw new Error('Campaign must be sending to complete');
    }
    this.props.status = 'sent';
    this.calculateRates();
    this.props.updatedAt = new Date();
  }

  pause(): void {
    if (this.props.status !== 'sending') {
      throw new Error('Can only pause sending campaigns');
    }
    this.props.status = 'paused';
    this.props.updatedAt = new Date();
  }

  resume(): void {
    if (this.props.status !== 'paused') {
      throw new Error('Can only resume paused campaigns');
    }
    this.props.status = 'sending';
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status === 'sent' || this.props.status === 'cancelled') {
      throw new Error('Cannot cancel completed or already cancelled campaigns');
    }
    this.props.status = 'cancelled';
    this.props.updatedAt = new Date();
  }

  recordDelivery(): void {
    this.props.deliveredCount++;
    this.props.updatedAt = new Date();
  }

  recordOpen(isUnique: boolean): void {
    this.props.openCount++;
    if (isUnique) this.props.uniqueOpenCount++;
    this.calculateRates();
    this.props.updatedAt = new Date();
  }

  recordClick(isUnique: boolean): void {
    this.props.clickCount++;
    if (isUnique) this.props.uniqueClickCount++;
    this.calculateRates();
    this.props.updatedAt = new Date();
  }

  recordBounce(type: 'soft' | 'hard'): void {
    this.props.bounceCount++;
    if (type === 'soft') this.props.softBounceCount++;
    else this.props.hardBounceCount++;
    this.props.updatedAt = new Date();
  }

  recordUnsubscribe(): void {
    this.props.unsubscribeCount++;
    this.props.updatedAt = new Date();
  }

  recordConversion(revenue: number): void {
    this.props.conversionCount++;
    this.props.revenue += revenue;
    this.props.updatedAt = new Date();
  }

  private calculateRates(): void {
    if (this.props.deliveredCount > 0) {
      this.props.openRate = (this.props.uniqueOpenCount / this.props.deliveredCount) * 100;
      this.props.clickRate = (this.props.uniqueClickCount / this.props.deliveredCount) * 100;
    }
  }

  toJSON(): Record<string, any> {
    return {
      emailCampaignId: this.props.emailCampaignId,
      merchantId: this.props.merchantId,
      name: this.props.name,
      subject: this.props.subject,
      preheader: this.props.preheader,
      fromName: this.props.fromName,
      fromEmail: this.props.fromEmail,
      replyTo: this.props.replyTo,
      status: this.props.status,
      campaignType: this.props.campaignType,
      templateId: this.props.templateId,
      segmentIds: this.props.segmentIds,
      tags: this.props.tags,
      scheduledAt: this.props.scheduledAt?.toISOString(),
      sentAt: this.props.sentAt?.toISOString(),
      stats: {
        totalRecipients: this.props.totalRecipients,
        sentCount: this.props.sentCount,
        deliveredCount: this.props.deliveredCount,
        openCount: this.props.openCount,
        uniqueOpenCount: this.props.uniqueOpenCount,
        clickCount: this.props.clickCount,
        uniqueClickCount: this.props.uniqueClickCount,
        bounceCount: this.props.bounceCount,
        unsubscribeCount: this.props.unsubscribeCount,
        complaintCount: this.props.complaintCount,
        revenue: this.props.revenue,
        conversionCount: this.props.conversionCount,
        openRate: this.props.openRate,
        clickRate: this.props.clickRate
      },
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
