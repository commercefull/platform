import { query, queryOne } from '../../../../libs/db';

export interface MarketingEmailCampaignRecipient {
  marketingEmailCampaignRecipientId: string;
  campaignId: string;
  customerId?: string;
  email: string;
  status: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
}

export async function bulkCreate(campaignId: string, recipients: { customerId?: string; email: string }[]): Promise<void> {
  if (!recipients.length) return;
  const now = new Date();
  const values = recipients.map((r, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, 'pending', $${i * 4 + 4})`).join(', ');
  const params = recipients.flatMap(r => [campaignId, r.customerId || null, r.email, now]);
  await query(`INSERT INTO "marketingEmailCampaignRecipient" ("campaignId", "customerId", email, status, "createdAt") VALUES ${values} ON CONFLICT DO NOTHING`, params);
}

export async function updateStatus(id: string, status: string, timestampField?: string): Promise<void> {
  const now = new Date();
  const extra = timestampField ? `, "${timestampField}" = '${now.toISOString()}'` : '';
  await query(`UPDATE "marketingEmailCampaignRecipient" SET status = $1${extra}, "updatedAt" = $2 WHERE "marketingEmailCampaignRecipientId" = $3`, [status, now, id]);
}

export async function findByCampaign(campaignId: string, status?: string): Promise<MarketingEmailCampaignRecipient[]> {
  const sql = status
    ? `SELECT * FROM "marketingEmailCampaignRecipient" WHERE "campaignId" = $1 AND status = $2`
    : `SELECT * FROM "marketingEmailCampaignRecipient" WHERE "campaignId" = $1`;
  return (await query<MarketingEmailCampaignRecipient[]>(sql, status ? [campaignId, status] : [campaignId])) || [];
}

export default { bulkCreate, updateStatus, findByCampaign };
