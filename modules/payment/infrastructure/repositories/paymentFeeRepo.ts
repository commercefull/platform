import { query, queryOne } from '../../../../libs/db';

export interface PaymentFee {
  paymentFeeId: string;
  transactionId: string;
  organizationId: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeSum {
  organizationId: string;
  totalAmount: number;
  currency: string;
}

export async function findByTransaction(transactionId: string): Promise<PaymentFee[]> {
  return (
    (await query<PaymentFee[]>(`SELECT * FROM "paymentFee" WHERE "transactionId" = $1 ORDER BY "createdAt" DESC`, [transactionId])) || []
  );
}

export async function create(params: Omit<PaymentFee, 'paymentFeeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentFee | null> {
  const now = new Date();
  return queryOne<PaymentFee>(
    `INSERT INTO "paymentFee" ("transactionId", "organizationId", type, amount, currency, description, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [params.transactionId, params.organizationId, params.type, params.amount, params.currency, params.description || null, now, now],
  );
}

export async function sumByMerchant(organizationId: string, currency: string): Promise<number> {
  const result = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM "paymentFee" WHERE "organizationId" = $1 AND currency = $2`,
    [organizationId, currency],
  );
  return result ? parseFloat(result.total) : 0;
}

export async function findAll(limit: number = 100): Promise<PaymentFee[]> {
  return (
    (await query<PaymentFee[]>(`SELECT * FROM "paymentFee" ORDER BY "createdAt" DESC LIMIT $1`, [limit])) || []
  );
}

export default { findByTransaction, create, sumByMerchant, findAll };
