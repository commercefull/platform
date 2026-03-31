import { query, queryOne } from '../../../../libs/db';

export interface MerchantTransaction {
  merchantTransactionId: string;
  merchantId: string;
  type: string;
  amount: number;
  currency: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

export async function create(params: Omit<MerchantTransaction, 'merchantTransactionId' | 'createdAt'>): Promise<MerchantTransaction | null> {
  return queryOne<MerchantTransaction>(
    `INSERT INTO "merchantTransaction" ("merchantId", type, amount, currency, "referenceId", "referenceType", description, "balanceBefore", "balanceAfter", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [params.merchantId, params.type, params.amount, params.currency, params.referenceId || null, params.referenceType || null, params.description || null, params.balanceBefore, params.balanceAfter, new Date()],
  );
}

export async function findByMerchant(merchantId: string, limit = 50, offset = 0): Promise<MerchantTransaction[]> {
  return (await query<MerchantTransaction[]>(
    `SELECT * FROM "merchantTransaction" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findByReference(referenceId: string, referenceType: string): Promise<MerchantTransaction[]> {
  return (await query<MerchantTransaction[]>(
    `SELECT * FROM "merchantTransaction" WHERE "referenceId" = $1 AND "referenceType" = $2`,
    [referenceId, referenceType],
  )) || [];
}

export default { create, findByMerchant, findByReference };
