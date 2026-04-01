import { query, queryOne } from '../../../../libs/db';

export interface MerchantPayoutItem {
  merchantPayoutItemId: string;
  merchantPayoutId: string;
  orderId?: string;
  description?: string;
  amount: number;
  currency: string;
  createdAt: Date;
}

export async function findByPayout(merchantPayoutId: string): Promise<MerchantPayoutItem[]> {
  return (await query<MerchantPayoutItem[]>(
    `SELECT * FROM "merchantPayoutItem" WHERE "merchantPayoutId" = $1 ORDER BY "createdAt" ASC`,
    [merchantPayoutId],
  )) || [];
}

export async function create(params: Omit<MerchantPayoutItem, 'merchantPayoutItemId' | 'createdAt'>): Promise<MerchantPayoutItem | null> {
  return queryOne<MerchantPayoutItem>(
    `INSERT INTO "merchantPayoutItem" ("merchantPayoutId", "orderId", description, amount, currency, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [params.merchantPayoutId, params.orderId || null, params.description || null, params.amount, params.currency, new Date()],
  );
}

export default { findByPayout, create };
