import { query, queryOne } from '../../../../libs/db';

export interface PaymentReport {
  paymentReportId: string;
  merchantId: string;
  type: string;
  currency: string;
  totalAmount: number;
  transactionCount: number;
  data?: Record<string, any>;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string): Promise<PaymentReport[]> {
  return (
    (await query<PaymentReport[]>(
      `SELECT * FROM "paymentReport" WHERE "merchantId" = $1 ORDER BY "periodStart" DESC`,
      [merchantId],
    )) || []
  );
}

export async function findByDateRange(merchantId: string, from: Date, to: Date): Promise<PaymentReport[]> {
  return (
    (await query<PaymentReport[]>(
      `SELECT * FROM "paymentReport" WHERE "merchantId" = $1 AND "periodStart" >= $2 AND "periodEnd" <= $3 ORDER BY "periodStart" DESC`,
      [merchantId, from, to],
    )) || []
  );
}

export async function create(
  params: Omit<PaymentReport, 'paymentReportId' | 'createdAt' | 'updatedAt'>,
): Promise<PaymentReport | null> {
  const now = new Date();
  return queryOne<PaymentReport>(
    `INSERT INTO "paymentReport" ("merchantId", type, currency, "totalAmount", "transactionCount", data, "periodStart", "periodEnd", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      params.merchantId,
      params.type,
      params.currency,
      params.totalAmount,
      params.transactionCount,
      params.data ? JSON.stringify(params.data) : null,
      params.periodStart,
      params.periodEnd,
      now,
      now,
    ],
  );
}

export default { findByMerchant, findByDateRange, create };
