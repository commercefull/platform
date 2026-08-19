import { query, queryOne } from '../../../../libs/db';

export interface PaymentBalance {
  paymentBalanceId: string;
  organizationId: string;
  currency: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceTransaction {
  paymentBalanceId: string;
  organizationId: string;
  currency: string;
  amount: number;
  type: 'credit' | 'debit';
  referenceId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(organizationId: string): Promise<PaymentBalance[]> {
  return (
    (await query<PaymentBalance[]>(`SELECT * FROM "paymentBalance" WHERE "organizationId" = $1 ORDER BY currency ASC`, [organizationId])) || []
  );
}

export async function credit(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null> {
  const now = new Date();
  return queryOne<PaymentBalance>(
    `INSERT INTO "paymentBalance" ("organizationId", currency, amount, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ("organizationId", currency) DO UPDATE SET amount = "paymentBalance".amount + $3, "updatedAt" = $5
     RETURNING *`,
    [organizationId, currency, amount, now, now],
  );
}

export async function debit(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null> {
  const now = new Date();
  return queryOne<PaymentBalance>(
    `UPDATE "paymentBalance" SET amount = amount - $1, "updatedAt" = $2
     WHERE "organizationId" = $3 AND currency = $4
     RETURNING *`,
    [amount, now, organizationId, currency],
  );
}

export async function getBalance(organizationId: string, currency: string): Promise<number> {
  const result = await queryOne<{ amount: string }>(
    `SELECT COALESCE(amount, 0) AS amount FROM "paymentBalance" WHERE "organizationId" = $1 AND currency = $2`,
    [organizationId, currency],
  );
  return result ? parseFloat(result.amount) : 0;
}

export async function findAll(): Promise<PaymentBalance[]> {
  return (
    (await query<PaymentBalance[]>(`SELECT * FROM "paymentBalance" ORDER BY "organizationId", currency`)) || []
  );
}

export default { findByMerchant, credit, debit, getBalance, findAll };
