import { query, queryOne } from '../../../../libs/db';

export interface MarketingAffiliate {
  marketingAffiliateId: string;
  customerId?: string;
  merchantId?: string;
  name: string;
  email: string;
  code: string;
  commissionRate: number;
  status: string;
  totalEarned: number;
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingAffiliateLink {
  marketingAffiliateLinkId: string;
  affiliateId: string;
  url: string;
  slug: string;
  clicks: number;
  conversions: number;
  createdAt: Date;
}

export interface MarketingAffiliateCommission {
  marketingAffiliateCommissionId: string;
  affiliateId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

export async function findByCode(code: string): Promise<MarketingAffiliate | null> {
  return queryOne<MarketingAffiliate>(`SELECT * FROM "marketingAffiliate" WHERE code = $1 AND status = 'active'`, [code]);
}

export async function findById(id: string): Promise<MarketingAffiliate | null> {
  return queryOne<MarketingAffiliate>(`SELECT * FROM "marketingAffiliate" WHERE "marketingAffiliateId" = $1`, [id]);
}

export async function create(params: Omit<MarketingAffiliate, 'marketingAffiliateId' | 'totalEarned' | 'totalPaid' | 'createdAt' | 'updatedAt'>): Promise<MarketingAffiliate | null> {
  const now = new Date();
  return queryOne<MarketingAffiliate>(
    `INSERT INTO "marketingAffiliate" ("customerId", "merchantId", name, email, code, "commissionRate", status, "totalEarned", "totalPaid", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9) RETURNING *`,
    [params.customerId || null, params.merchantId || null, params.name, params.email, params.code, params.commissionRate, params.status, now, now],
  );
}

export async function createLink(affiliateId: string, url: string, slug: string): Promise<MarketingAffiliateLink | null> {
  return queryOne<MarketingAffiliateLink>(
    `INSERT INTO "marketingAffiliateLink" ("affiliateId", url, slug, clicks, conversions, "createdAt") VALUES ($1, $2, $3, 0, 0, $4) RETURNING *`,
    [affiliateId, url, slug, new Date()],
  );
}

export async function recordCommission(affiliateId: string, orderId: string, amount: number, currency: string): Promise<MarketingAffiliateCommission | null> {
  const result = await queryOne<MarketingAffiliateCommission>(
    `INSERT INTO "marketingAffiliateCommission" ("affiliateId", "orderId", amount, currency, status, "createdAt") VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
    [affiliateId, orderId, amount, currency, new Date()],
  );
  if (result) {
    await query(`UPDATE "marketingAffiliate" SET "totalEarned" = "totalEarned" + $1, "updatedAt" = $2 WHERE "marketingAffiliateId" = $3`, [amount, new Date(), affiliateId]);
  }
  return result;
}

export async function findCommissions(affiliateId: string, status?: string): Promise<MarketingAffiliateCommission[]> {
  const sql = status
    ? `SELECT * FROM "marketingAffiliateCommission" WHERE "affiliateId" = $1 AND status = $2 ORDER BY "createdAt" DESC`
    : `SELECT * FROM "marketingAffiliateCommission" WHERE "affiliateId" = $1 ORDER BY "createdAt" DESC`;
  return (await query<MarketingAffiliateCommission[]>(sql, status ? [affiliateId, status] : [affiliateId])) || [];
}

export default { findByCode, findById, create, createLink, recordCommission, findCommissions };
