import { query, queryOne } from '../../../../libs/db';

export interface PaymentReport {
  paymentReportId: string;
  organizationId: string;
  type: string;
  currency: string;
  totalAmount: number;
  transactionCount: number;
  data?: Record<string, unknown>;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(organizationId: string): Promise<PaymentReport[]> {
  return (
    (await query<PaymentReport[]>(`SELECT * FROM "paymentReport" WHERE "organizationId" = $1 ORDER BY "periodStart" DESC`, [organizationId])) || []
  );
}

export async function findByDateRange(organizationId: string, from: Date, to: Date): Promise<PaymentReport[]> {
  return (
    (await query<PaymentReport[]>(
      `SELECT * FROM "paymentReport" WHERE "organizationId" = $1 AND "periodStart" >= $2 AND "periodEnd" <= $3 ORDER BY "periodStart" DESC`,
      [organizationId, from, to],
    )) || []
  );
}

export async function create(params: Omit<PaymentReport, 'paymentReportId' | 'createdAt' | 'updatedAt'>): Promise<PaymentReport | null> {
  const now = new Date();
  return queryOne<PaymentReport>(
    `INSERT INTO "paymentReport" ("organizationId", type, currency, "totalAmount", "transactionCount", data, "periodStart", "periodEnd", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      params.organizationId,
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

export async function findAll(limit: number = 100): Promise<PaymentReport[]> {
  return (
    (await query<PaymentReport[]>(`SELECT * FROM "paymentReport" ORDER BY "periodStart" DESC LIMIT $1`, [limit])) || []
  );
}

export async function findById(paymentReportId: string): Promise<PaymentReport | null> {
  return queryOne<PaymentReport>(`SELECT * FROM "paymentReport" WHERE "paymentReportId" = $1`, [paymentReportId]);
}

export default { findByMerchant, findByDateRange, create, findAll, findById };
