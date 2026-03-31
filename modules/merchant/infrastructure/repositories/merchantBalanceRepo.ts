import { query, queryOne } from '../../../../libs/db';

export interface MerchantBalance {
  merchantBalanceId: string;
  merchantId: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  reservedBalance: number;
  totalEarned: number;
  totalPaid: number;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string, currency = 'USD'): Promise<MerchantBalance | null> {
  return queryOne<MerchantBalance>(
    `SELECT * FROM "merchantBalance" WHERE "merchantId" = $1 AND currency = $2`,
    [merchantId, currency],
  );
}

export async function upsert(merchantId: string, currency: string): Promise<MerchantBalance | null> {
  const now = new Date();
  return queryOne<MerchantBalance>(
    `INSERT INTO "merchantBalance" ("merchantId", currency, "availableBalance", "pendingBalance", "reservedBalance", "totalEarned", "totalPaid", "updatedAt")
     VALUES ($1, $2, 0, 0, 0, 0, 0, $3)
     ON CONFLICT ("merchantId", currency) DO UPDATE SET "updatedAt" = $3
     RETURNING *`,
    [merchantId, currency, now],
  );
}

export async function credit(merchantId: string, currency: string, amount: number): Promise<void> {
  await query(
    `UPDATE "merchantBalance" SET "pendingBalance" = "pendingBalance" + $1, "totalEarned" = "totalEarned" + $1, "updatedAt" = $2
     WHERE "merchantId" = $3 AND currency = $4`,
    [amount, new Date(), merchantId, currency],
  );
}

export async function release(merchantId: string, currency: string, amount: number): Promise<void> {
  await query(
    `UPDATE "merchantBalance" SET "pendingBalance" = "pendingBalance" - $1, "availableBalance" = "availableBalance" + $1, "updatedAt" = $2
     WHERE "merchantId" = $3 AND currency = $4`,
    [amount, new Date(), merchantId, currency],
  );
}

export async function debit(merchantId: string, currency: string, amount: number): Promise<void> {
  await query(
    `UPDATE "merchantBalance" SET "availableBalance" = "availableBalance" - $1, "totalPaid" = "totalPaid" + $1, "updatedAt" = $2
     WHERE "merchantId" = $3 AND currency = $4`,
    [amount, new Date(), merchantId, currency],
  );
}

export default { findByMerchant, upsert, credit, release, debit };
