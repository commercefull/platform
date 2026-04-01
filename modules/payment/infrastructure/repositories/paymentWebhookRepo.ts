import { query, queryOne } from '../../../../libs/db';

export interface PaymentWebhook {
  paymentWebhookId: string;
  externalId: string;
  provider: string;
  eventType: string;
  payload: Record<string, any>;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByExternalId(externalId: string): Promise<PaymentWebhook | null> {
  return queryOne<PaymentWebhook>(
    `SELECT * FROM "paymentWebhook" WHERE "externalId" = $1`,
    [externalId],
  );
}

export async function create(
  params: Omit<PaymentWebhook, 'paymentWebhookId' | 'createdAt' | 'updatedAt'>,
): Promise<PaymentWebhook | null> {
  const now = new Date();
  return queryOne<PaymentWebhook>(
    `INSERT INTO "paymentWebhook" ("externalId", provider, "eventType", payload, "processedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.externalId, params.provider, params.eventType, JSON.stringify(params.payload), params.processedAt || null, now, now],
  );
}

export async function markProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null> {
  const now = new Date();
  return queryOne<PaymentWebhook>(
    `UPDATE "paymentWebhook" SET "processedAt" = $1, "updatedAt" = $1 WHERE "paymentWebhookId" = $2 RETURNING *`,
    [now, paymentWebhookId],
  );
}

export default { findByExternalId, create, markProcessed };
