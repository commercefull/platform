import { query, queryOne } from '../../../../libs/db';

export interface MerchantPayout {
  merchantPayoutId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: string;
  scheduledAt?: Date;
  processedAt?: Date;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string, limit = 20, offset = 0): Promise<MerchantPayout[]> {
  return (await query<MerchantPayout[]>(
    `SELECT * FROM "merchantPayout" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findById(merchantPayoutId: string): Promise<MerchantPayout | null> {
  return queryOne<MerchantPayout>(
    `SELECT * FROM "merchantPayout" WHERE "merchantPayoutId" = $1`,
    [merchantPayoutId],
  );
}

export async function create(params: Omit<MerchantPayout, 'merchantPayoutId' | 'createdAt' | 'updatedAt'>): Promise<MerchantPayout | null> {
  const now = new Date();
  return queryOne<MerchantPayout>(
    `INSERT INTO "merchantPayout" ("merchantId", amount, currency, status, "scheduledAt", "processedAt", reference, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [params.merchantId, params.amount, params.currency, params.status || 'pending', params.scheduledAt || null, params.processedAt || null, params.reference || null, now, now],
  );
}

export async function updateStatus(merchantPayoutId: string, status: string, processedAt?: Date): Promise<void> {
  await query(
    `UPDATE "merchantPayout" SET status = $1, "processedAt" = $2, "updatedAt" = $3 WHERE "merchantPayoutId" = $4`,
    [status, processedAt || null, new Date(), merchantPayoutId],
  );
}

export default { findByMerchant, findById, create, updateStatus };
