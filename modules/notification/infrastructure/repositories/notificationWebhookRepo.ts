import { query, queryOne } from '../../../../libs/db';

export interface NotificationWebhook {
  notificationWebhookId: string;
  merchantId?: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findActive(event: string): Promise<NotificationWebhook[]> {
  return (await query<NotificationWebhook[]>(
    `SELECT * FROM "notificationWebhook" WHERE "isActive" = true AND events @> $1::jsonb`,
    [JSON.stringify([event])],
  )) || [];
}

export async function findByMerchant(merchantId: string): Promise<NotificationWebhook[]> {
  return (await query<NotificationWebhook[]>(
    `SELECT * FROM "notificationWebhook" WHERE "merchantId" = $1`,
    [merchantId],
  )) || [];
}

export async function create(params: Omit<NotificationWebhook, 'notificationWebhookId' | 'createdAt' | 'updatedAt'>): Promise<NotificationWebhook | null> {
  const now = new Date();
  return queryOne<NotificationWebhook>(
    `INSERT INTO "notificationWebhook" ("merchantId", url, secret, events, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.merchantId || null, params.url, params.secret || null, JSON.stringify(params.events), params.isActive, now, now],
  );
}

export async function deactivate(notificationWebhookId: string): Promise<void> {
  await query(`UPDATE "notificationWebhook" SET "isActive" = false, "updatedAt" = $1 WHERE "notificationWebhookId" = $2`, [new Date(), notificationWebhookId]);
}

export default { findActive, findByMerchant, create, deactivate };
