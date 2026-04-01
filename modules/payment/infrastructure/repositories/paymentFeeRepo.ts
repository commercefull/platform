import { query, queryOne } from '../../../../libs/db';

export interface PaymentFee {
  paymentFeeId: string;
  transactionId: string;
  merchantId: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeSum {
  merchantId: string;
  totalAmount: number;
  currency: string;
}

export async function findByTransaction(transactionId: string): Promise<PaymentFee[]> {
  return (
    (await query<PaymentFee[]>(
      `SELECT * FROM "paymentFee" WHERE "transactionId" = $1 ORDER BY "createdAt" DESC`,
      [transactionId],
    )) || []
  );
}

export async function create(
  params: Omit<PaymentFee, 'paymentFeeId' | 'createdAt' | 'updatedAt'>,
): Promise<PaymentFee | null> {
  const now = new Date();
  return queryOne<PaymentFee>(
    `INSERT INTO "paymentFee" ("transactionId", "merchantId", type, amount, currency, description, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [params.transactionId, params.merchantId, params.type, params.amount, params.currency, params.description || null, now, now],
  );
}

export async function sumByMerchant(merchantId: string, currency: string): Promise<number> {
  const result = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM "paymentFee" WHERE "merchantId" = $1 AND currency = $2`,
    [merchantId, currency],
  );
  return result ? parseFloat(result.total) : 0;
}

export default { findByTransaction, create, sumByMerchant };
