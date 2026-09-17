import { query, queryOne } from '../../../../libs/db';

export interface NotificationWebhook {
  notificationWebhookId: string;
  organizationId?: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findActive(event: string): Promise<NotificationWebhook[]> {
  return (
    (await query<NotificationWebhook[]>(`SELECT * FROM "notificationWebhook" WHERE "isActive" = true AND events @> $1::jsonb`, [
      JSON.stringify([event]),
    ])) || []
  );
}

export async function findByMerchant(_organizationId?: string): Promise<NotificationWebhook[]> {
  // notificationWebhook has no organizationId column — webhooks are global.
  return (await query<NotificationWebhook[]>(`SELECT * FROM "notificationWebhook" ORDER BY "createdAt" DESC`)) || [];
}

export async function create(
  params: Omit<NotificationWebhook, 'notificationWebhookId' | 'createdAt' | 'updatedAt'>,
): Promise<NotificationWebhook | null> {
  const now = new Date();
  let name = 'webhook';
  try {
    name = new URL(params.url).hostname;
  } catch {
    /* keep default name */
  }
  return queryOne<NotificationWebhook>(
    `INSERT INTO "notificationWebhook" (name, url, secret, events, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, params.url, params.secret || null, JSON.stringify(params.events), params.isActive, now, now],
  );
}

export async function deactivate(notificationWebhookId: string): Promise<void> {
  await query(`UPDATE "notificationWebhook" SET "isActive" = false, "updatedAt" = $1 WHERE "notificationWebhookId" = $2`, [
    new Date(),
    notificationWebhookId,
  ]);
}

export async function findAll(): Promise<NotificationWebhook[]> {
  return (await query<NotificationWebhook[]>(`SELECT * FROM "notificationWebhook" ORDER BY "createdAt" DESC`)) || [];
}

export default { findActive, findByMerchant, create, deactivate, findAll };
