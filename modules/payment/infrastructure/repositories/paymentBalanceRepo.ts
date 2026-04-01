import { query, queryOne } from '../../../../libs/db';

export interface PaymentBalance {
  paymentBalanceId: string;
  merchantId: string;
  currency: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceTransaction {
  paymentBalanceId: string;
  merchantId: string;
  currency: string;
  amount: number;
  type: 'credit' | 'debit';
  referenceId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string): Promise<PaymentBalance[]> {
  return (
    (await query<PaymentBalance[]>(
      `SELECT * FROM "paymentBalance" WHERE "merchantId" = $1 ORDER BY currency ASC`,
      [merchantId],
    )) || []
  );
}

export async function credit(
  merchantId: string,
  currency: string,
  amount: number,
): Promise<PaymentBalance | null> {
  const now = new Date();
  return queryOne<PaymentBalance>(
    `INSERT INTO "paymentBalance" ("merchantId", currency, amount, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ("merchantId", currency) DO UPDATE SET amount = "paymentBalance".amount + $3, "updatedAt" = $5
     RETURNING *`,
    [merchantId, currency, amount, now, now],
  );
}

export async function debit(
  merchantId: string,
  currency: string,
  amount: number,
): Promise<PaymentBalance | null> {
  const now = new Date();
  return queryOne<PaymentBalance>(
    `UPDATE "paymentBalance" SET amount = amount - $1, "updatedAt" = $2
     WHERE "merchantId" = $3 AND currency = $4
     RETURNING *`,
    [amount, now, merchantId, currency],
  );
}

export async function getBalance(merchantId: string, currency: string): Promise<number> {
  const result = await queryOne<{ amount: string }>(
    `SELECT COALESCE(amount, 0) AS amount FROM "paymentBalance" WHERE "merchantId" = $1 AND currency = $2`,
    [merchantId, currency],
  );
  return result ? parseFloat(result.amount) : 0;
}

export default { findByMerchant, credit, debit, getBalance };
