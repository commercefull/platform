import { query, queryOne } from '../../../../libs/db';

export interface MarketingEmailCampaign {
  marketingEmailCampaignId: string;
  merchantId?: string;
  name: string;
  subject: string;
  templateId?: string;
  status: string;
  scheduledAt?: Date;
  sentAt?: Date;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function create(params: Omit<MarketingEmailCampaign, 'marketingEmailCampaignId' | 'recipientCount' | 'openCount' | 'clickCount' | 'createdAt' | 'updatedAt'>): Promise<MarketingEmailCampaign | null> {
  const now = new Date();
  return queryOne<MarketingEmailCampaign>(
    `INSERT INTO "marketingEmailCampaign" ("merchantId", name, subject, "templateId", status, "scheduledAt", "sentAt", "recipientCount", "openCount", "clickCount", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, $8, $9) RETURNING *`,
    [params.merchantId || null, params.name, params.subject, params.templateId || null, params.status, params.scheduledAt || null, params.sentAt || null, now, now],
  );
}

export async function findById(id: string): Promise<MarketingEmailCampaign | null> {
  return queryOne<MarketingEmailCampaign>(`SELECT * FROM "marketingEmailCampaign" WHERE "marketingEmailCampaignId" = $1`, [id]);
}

export async function findByStatus(status: string, limit = 50): Promise<MarketingEmailCampaign[]> {
  return (await query<MarketingEmailCampaign[]>(
    `SELECT * FROM "marketingEmailCampaign" WHERE status = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [status, limit],
  )) || [];
}

export async function updateStatus(id: string, status: string): Promise<void> {
  await query(`UPDATE "marketingEmailCampaign" SET status = $1, "updatedAt" = $2 WHERE "marketingEmailCampaignId" = $3`, [status, new Date(), id]);
}

export async function incrementStats(id: string, field: 'openCount' | 'clickCount'): Promise<void> {
  await query(`UPDATE "marketingEmailCampaign" SET "${field}" = "${field}" + 1, "updatedAt" = $1 WHERE "marketingEmailCampaignId" = $2`, [new Date(), id]);
}

export default { create, findById, findByStatus, updateStatus, incrementStats };
