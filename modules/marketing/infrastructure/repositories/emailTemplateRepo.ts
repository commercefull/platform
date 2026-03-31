import { query, queryOne } from '../../../../libs/db';

export interface MarketingEmailTemplate {
  marketingEmailTemplateId: string;
  merchantId?: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findAll(merchantId?: string): Promise<MarketingEmailTemplate[]> {
  const sql = merchantId
    ? `SELECT * FROM "marketingEmailTemplate" WHERE ("merchantId" = $1 OR "merchantId" IS NULL) AND "isActive" = true ORDER BY name ASC`
    : `SELECT * FROM "marketingEmailTemplate" WHERE "isActive" = true ORDER BY name ASC`;
  return (await query<MarketingEmailTemplate[]>(sql, merchantId ? [merchantId] : [])) || [];
}

export async function findById(id: string): Promise<MarketingEmailTemplate | null> {
  return queryOne<MarketingEmailTemplate>(`SELECT * FROM "marketingEmailTemplate" WHERE "marketingEmailTemplateId" = $1`, [id]);
}

export async function create(params: Omit<MarketingEmailTemplate, 'marketingEmailTemplateId' | 'createdAt' | 'updatedAt'>): Promise<MarketingEmailTemplate | null> {
  const now = new Date();
  return queryOne<MarketingEmailTemplate>(
    `INSERT INTO "marketingEmailTemplate" ("merchantId", name, subject, "htmlBody", "textBody", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [params.merchantId || null, params.name, params.subject, params.htmlBody, params.textBody || null, params.isActive, now, now],
  );
}

export default { findAll, findById, create };
