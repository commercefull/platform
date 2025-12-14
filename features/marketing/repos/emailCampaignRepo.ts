/**
 * Email Campaign Repository
 * Handles CRUD operations for email campaigns
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
export type CampaignType = 'regular' | 'automated' | 'ab_test' | 'transactional';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained' | 'failed';

export interface EmailCampaign {
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

export interface EmailCampaignRecipient {
  emailCampaignRecipientId: string;
  emailCampaignId: string;
  customerId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: RecipientStatus;
  variant?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  firstOpenedAt?: Date;
  lastOpenedAt?: Date;
  openCount: number;
  firstClickedAt?: Date;
  lastClickedAt?: Date;
  clickCount: number;
  bouncedAt?: Date;
  bounceType?: 'soft' | 'hard';
  bounceReason?: string;
  unsubscribedAt?: Date;
  complainedAt?: Date;
  failureReason?: string;
  messageId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  country?: string;
  city?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  emailTemplateId: string;
  merchantId?: string;
  name: string;
  slug?: string;
  category: string;
  description?: string;
  subject?: string;
  preheader?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables: string[];
  thumbnailUrl?: string;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Email Campaign CRUD
// ============================================================================

export async function getCampaign(emailCampaignId: string): Promise<EmailCampaign | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingEmailCampaign" WHERE "marketingEmailCampaignId" = $1 AND "deletedAt" IS NULL',
    [emailCampaignId]
  );
  return row ? mapToCampaign(row) : null;
}

export async function getCampaignsByMerchant(
  merchantId: string,
  filters?: { status?: CampaignStatus; campaignType?: CampaignType },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: EmailCampaign[]; total: number }> {
  let whereClause = '"merchantId" = $1 AND "deletedAt" IS NULL';
  const params: any[] = [merchantId];
  let paramIndex = 2;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.campaignType) {
    whereClause += ` AND "campaignType" = $${paramIndex++}`;
    params.push(filters.campaignType);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "marketingEmailCampaign" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "marketingEmailCampaign" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToCampaign),
    total: parseInt(countResult?.count || '0')
  };
}

export async function saveCampaign(campaign: Partial<EmailCampaign> & { name: string; subject: string }): Promise<EmailCampaign> {
  const now = new Date().toISOString();

  if (campaign.emailCampaignId) {
    await query(
      `UPDATE "marketingEmailCampaign" SET
        "name" = $1, "subject" = $2, "preheader" = $3, "fromName" = $4, "fromEmail" = $5,
        "replyTo" = $6, "bodyHtml" = $7, "bodyText" = $8, "status" = $9, "campaignType" = $10,
        "templateId" = $11, "segmentIds" = $12, "tags" = $13, "scheduledAt" = $14, "sentAt" = $15,
        "totalRecipients" = $16, "sentCount" = $17, "deliveredCount" = $18, "openCount" = $19,
        "uniqueOpenCount" = $20, "clickCount" = $21, "uniqueClickCount" = $22, "bounceCount" = $23,
        "unsubscribeCount" = $24, "revenue" = $25, "conversionCount" = $26, "openRate" = $27,
        "clickRate" = $28, "updatedAt" = $29
      WHERE "marketingEmailCampaignId" = $30`,
      [
        campaign.name, campaign.subject, campaign.preheader, campaign.fromName, campaign.fromEmail,
        campaign.replyTo, campaign.bodyHtml, campaign.bodyText, campaign.status || 'draft',
        campaign.campaignType || 'regular', campaign.templateId,
        JSON.stringify(campaign.segmentIds || []), JSON.stringify(campaign.tags || []),
        campaign.scheduledAt?.toISOString(), campaign.sentAt?.toISOString(),
        campaign.totalRecipients || 0, campaign.sentCount || 0, campaign.deliveredCount || 0,
        campaign.openCount || 0, campaign.uniqueOpenCount || 0, campaign.clickCount || 0,
        campaign.uniqueClickCount || 0, campaign.bounceCount || 0, campaign.unsubscribeCount || 0,
        campaign.revenue || 0, campaign.conversionCount || 0, campaign.openRate, campaign.clickRate,
        now, campaign.emailCampaignId
      ]
    );
    return (await getCampaign(campaign.emailCampaignId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "marketingEmailCampaign" (
        "merchantId", "name", "subject", "preheader", "fromName", "fromEmail", "replyTo",
        "bodyHtml", "bodyText", "status", "campaignType", "templateId", "segmentIds", "tags",
        "scheduledAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        campaign.merchantId, campaign.name, campaign.subject, campaign.preheader,
        campaign.fromName, campaign.fromEmail, campaign.replyTo, campaign.bodyHtml,
        campaign.bodyText, 'draft', campaign.campaignType || 'regular', campaign.templateId,
        JSON.stringify(campaign.segmentIds || []), JSON.stringify(campaign.tags || []),
        campaign.scheduledAt?.toISOString(), now, now
      ]
    );
    return mapToCampaign(result!);
  }
}

export async function deleteCampaign(emailCampaignId: string): Promise<void> {
  await query(
    'UPDATE "marketingEmailCampaign" SET "deletedAt" = $1 WHERE "marketingEmailCampaignId" = $2',
    [new Date().toISOString(), emailCampaignId]
  );
}

export async function updateCampaignStats(emailCampaignId: string, stats: Partial<{
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  uniqueOpenCount: number;
  clickCount: number;
  uniqueClickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  revenue: number;
  conversionCount: number;
}>): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(stats)) {
    if (value !== undefined) {
      updates.push(`"${key}" = $${paramIndex++}`);
      params.push(value);
    }
  }

  if (updates.length > 0) {
    updates.push(`"updatedAt" = $${paramIndex++}`);
    params.push(new Date().toISOString());
    params.push(emailCampaignId);

    await query(
      `UPDATE "marketingEmailCampaign" SET ${updates.join(', ')} WHERE "marketingEmailCampaignId" = $${paramIndex}`,
      params
    );
  }
}

// ============================================================================
// Email Campaign Recipients
// ============================================================================

export async function addRecipients(emailCampaignId: string, recipients: Array<{
  customerId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  variant?: string;
}>): Promise<number> {
  if (recipients.length === 0) return 0;

  const now = new Date().toISOString();
  const values: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const r of recipients) {
    values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 'pending', $${paramIndex++}, $${paramIndex++})`);
    params.push(emailCampaignId, r.customerId, r.email, r.firstName, r.lastName, now, now);
  }

  await query(
    `INSERT INTO "marketingEmailCampaignRecipient" 
     ("marketingEmailCampaignId", "customerId", "email", "firstName", "lastName", "status", "createdAt", "updatedAt")
     VALUES ${values.join(', ')}
     ON CONFLICT ("marketingEmailCampaignId", "email") DO NOTHING`,
    params
  );

  return recipients.length;
}

export async function getRecipients(
  emailCampaignId: string,
  filters?: { status?: RecipientStatus },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: EmailCampaignRecipient[]; total: number }> {
  let whereClause = '"marketingEmailCampaignId" = $1';
  const params: any[] = [emailCampaignId];
  let paramIndex = 2;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "marketingEmailCampaignRecipient" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 100;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "marketingEmailCampaignRecipient" WHERE ${whereClause} 
     ORDER BY "createdAt" ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToRecipient),
    total: parseInt(countResult?.count || '0')
  };
}

export async function updateRecipientStatus(
  emailCampaignRecipientId: string,
  status: RecipientStatus,
  details?: Partial<EmailCampaignRecipient>
): Promise<void> {
  const updates: string[] = ['"status" = $1', '"updatedAt" = $2'];
  const params: any[] = [status, new Date().toISOString()];
  let paramIndex = 3;

  if (details) {
    for (const [key, value] of Object.entries(details)) {
      if (value !== undefined && key !== 'status') {
        updates.push(`"${key}" = $${paramIndex++}`);
        params.push(value instanceof Date ? value.toISOString() : value);
      }
    }
  }

  params.push(emailCampaignRecipientId);

  await query(
    `UPDATE "marketingEmailCampaignRecipient" SET ${updates.join(', ')} WHERE "emailCampaignRecipientId" = $${paramIndex}`,
    params
  );
}

// ============================================================================
// Email Templates
// ============================================================================

export async function getTemplate(emailTemplateId: string): Promise<EmailTemplate | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingEmailTemplate" WHERE "marketingEmailTemplateId" = $1 AND "deletedAt" IS NULL',
    [emailTemplateId]
  );
  return row ? mapToTemplate(row) : null;
}

export async function getTemplatesByMerchant(
  merchantId: string,
  filters?: { category?: string; isActive?: boolean }
): Promise<EmailTemplate[]> {
  let whereClause = '"merchantId" = $1 AND "deletedAt" IS NULL';
  const params: any[] = [merchantId];
  let paramIndex = 2;

  if (filters?.category) {
    whereClause += ` AND "category" = $${paramIndex++}`;
    params.push(filters.category);
  }
  if (filters?.isActive !== undefined) {
    whereClause += ` AND "isActive" = $${paramIndex++}`;
    params.push(filters.isActive);
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "marketingEmailTemplate" WHERE ${whereClause} ORDER BY "name" ASC`,
    params
  );

  return (rows || []).map(mapToTemplate);
}

export async function saveTemplate(template: Partial<EmailTemplate> & { name: string }): Promise<EmailTemplate> {
  const now = new Date().toISOString();

  if (template.emailTemplateId) {
    await query(
      `UPDATE "marketingEmailTemplate" SET
        "name" = $1, "slug" = $2, "category" = $3, "description" = $4, "subject" = $5,
        "preheader" = $6, "bodyHtml" = $7, "bodyText" = $8, "variables" = $9,
        "thumbnailUrl" = $10, "isActive" = $11, "updatedAt" = $12
      WHERE "marketingEmailTemplateId" = $13`,
      [
        template.name, template.slug, template.category || 'custom', template.description,
        template.subject, template.preheader, template.bodyHtml, template.bodyText,
        JSON.stringify(template.variables || []), template.thumbnailUrl,
        template.isActive !== false, now, template.emailTemplateId
      ]
    );
    return (await getTemplate(template.emailTemplateId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "marketingEmailTemplate" (
        "merchantId", "name", "slug", "category", "description", "subject", "preheader",
        "bodyHtml", "bodyText", "variables", "thumbnailUrl", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        template.merchantId, template.name, template.slug, template.category || 'custom',
        template.description, template.subject, template.preheader, template.bodyHtml,
        template.bodyText, JSON.stringify(template.variables || []), template.thumbnailUrl,
        true, now, now
      ]
    );
    return mapToTemplate(result!);
  }
}

export async function deleteTemplate(emailTemplateId: string): Promise<void> {
  await query(
    'UPDATE "marketingEmailTemplate" SET "deletedAt" = $1 WHERE "marketingEmailTemplateId" = $2',
    [new Date().toISOString(), emailTemplateId]
  );
}

// ============================================================================
// Helpers
// ============================================================================

function mapToCampaign(row: Record<string, any>): EmailCampaign {
  return {
    emailCampaignId: row.marketingEmailCampaignId,
    merchantId: row.merchantId,
    name: row.name,
    subject: row.subject,
    preheader: row.preheader,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    replyTo: row.replyTo,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    status: row.status,
    campaignType: row.campaignType,
    templateId: row.templateId,
    segmentIds: row.segmentIds || [],
    tags: row.tags || [],
    scheduledAt: row.scheduledAt ? new Date(row.scheduledAt) : undefined,
    sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    totalRecipients: parseInt(row.totalRecipients) || 0,
    sentCount: parseInt(row.sentCount) || 0,
    deliveredCount: parseInt(row.deliveredCount) || 0,
    openCount: parseInt(row.openCount) || 0,
    uniqueOpenCount: parseInt(row.uniqueOpenCount) || 0,
    clickCount: parseInt(row.clickCount) || 0,
    uniqueClickCount: parseInt(row.uniqueClickCount) || 0,
    bounceCount: parseInt(row.bounceCount) || 0,
    softBounceCount: parseInt(row.softBounceCount) || 0,
    hardBounceCount: parseInt(row.hardBounceCount) || 0,
    unsubscribeCount: parseInt(row.unsubscribeCount) || 0,
    complaintCount: parseInt(row.complaintCount) || 0,
    revenue: parseFloat(row.revenue) || 0,
    conversionCount: parseInt(row.conversionCount) || 0,
    openRate: row.openRate ? parseFloat(row.openRate) : undefined,
    clickRate: row.clickRate ? parseFloat(row.clickRate) : undefined,
    abTestConfig: row.abTestConfig,
    winningVariant: row.winningVariant,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
  };
}

function mapToRecipient(row: Record<string, any>): EmailCampaignRecipient {
  return {
    emailCampaignRecipientId: row.marketingEmailCampaignRecipientId,
    emailCampaignId: row.marketingEmailCampaignId,
    customerId: row.customerId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    status: row.status,
    variant: row.variant,
    sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
    firstOpenedAt: row.firstOpenedAt ? new Date(row.firstOpenedAt) : undefined,
    lastOpenedAt: row.lastOpenedAt ? new Date(row.lastOpenedAt) : undefined,
    openCount: parseInt(row.openCount) || 0,
    firstClickedAt: row.firstClickedAt ? new Date(row.firstClickedAt) : undefined,
    lastClickedAt: row.lastClickedAt ? new Date(row.lastClickedAt) : undefined,
    clickCount: parseInt(row.clickCount) || 0,
    bouncedAt: row.bouncedAt ? new Date(row.bouncedAt) : undefined,
    bounceType: row.bounceType,
    bounceReason: row.bounceReason,
    unsubscribedAt: row.unsubscribedAt ? new Date(row.unsubscribedAt) : undefined,
    complainedAt: row.complainedAt ? new Date(row.complainedAt) : undefined,
    failureReason: row.failureReason,
    messageId: row.messageId,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    deviceType: row.deviceType,
    country: row.country,
    city: row.city,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToTemplate(row: Record<string, any>): EmailTemplate {
  return {
    emailTemplateId: row.marketingEmailTemplateId,
    merchantId: row.merchantId,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    subject: row.subject,
    preheader: row.preheader,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    variables: row.variables || [],
    thumbnailUrl: row.thumbnailUrl,
    isDefault: Boolean(row.isDefault),
    isActive: Boolean(row.isActive),
    usageCount: parseInt(row.usageCount) || 0,
    lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
