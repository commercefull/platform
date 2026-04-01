import { query, queryOne } from '../../../../libs/db';

export interface PaymentDispute {
  paymentDisputeId: string;
  paymentId: string;
  merchantId: string;
  externalDisputeId?: string;
  status: string;
  reason?: string;
  amount: number;
  currency: string;
  evidence?: Record<string, any>;
  dueBy?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByPayment(paymentId: string): Promise<PaymentDispute[]> {
  return (
    (await query<PaymentDispute[]>(
      `SELECT * FROM "paymentDispute" WHERE "paymentId" = $1 ORDER BY "createdAt" DESC`,
      [paymentId],
    )) || []
  );
}

export async function findById(paymentDisputeId: string): Promise<PaymentDispute | null> {
  return queryOne<PaymentDispute>(
    `SELECT * FROM "paymentDispute" WHERE "paymentDisputeId" = $1`,
    [paymentDisputeId],
  );
}

export async function create(
  params: Omit<PaymentDispute, 'paymentDisputeId' | 'createdAt' | 'updatedAt'>,
): Promise<PaymentDispute | null> {
  const now = new Date();
  return queryOne<PaymentDispute>(
    `INSERT INTO "paymentDispute" ("paymentId", "merchantId", "externalDisputeId", status, reason, amount, currency, evidence, "dueBy", "resolvedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      params.paymentId,
      params.merchantId,
      params.externalDisputeId || null,
      params.status,
      params.reason || null,
      params.amount,
      params.currency,
      params.evidence ? JSON.stringify(params.evidence) : null,
      params.dueBy || null,
      params.resolvedAt || null,
      now,
      now,
    ],
  );
}

export async function updateStatus(
  paymentDisputeId: string,
  status: string,
  resolvedAt?: Date,
): Promise<PaymentDispute | null> {
  return queryOne<PaymentDispute>(
    `UPDATE "paymentDispute" SET status = $1, "resolvedAt" = $2, "updatedAt" = $3 WHERE "paymentDisputeId" = $4 RETURNING *`,
    [status, resolvedAt || null, new Date(), paymentDisputeId],
  );
}

export default { findByPayment, findById, create, updateStatus };
