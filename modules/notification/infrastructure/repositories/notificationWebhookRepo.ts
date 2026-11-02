import { query, queryOne } from '../../../../libs/db';
import type { NotificationWebhook as DbNotificationWebhook } from '../../../../libs/db/types';
import type { NotificationWebhook } from '../../domain/repositories/NotificationWebhookRepository';

function rowToWebhook(row: DbNotificationWebhook): NotificationWebhook {
  return {
    notificationWebhookId: row.notificationWebhookId,
    url: row.url,
    secret: row.secret ?? undefined,
    events: Array.isArray(row.events) ? (row.events as string[]) : [],
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findActive(event: string): Promise<NotificationWebhook[]> {
  const rows = await query<DbNotificationWebhook[]>(`SELECT * FROM "notificationWebhook" WHERE "isActive" = true AND events @> $1::jsonb`, [
    JSON.stringify([event]),
  ]);
  return (rows || []).map(rowToWebhook);
}

async function findByMerchant(_organizationId?: string): Promise<NotificationWebhook[]> {
  // notificationWebhook has no organizationId column — webhooks are global.
  const rows = await query<DbNotificationWebhook[]>(`SELECT * FROM "notificationWebhook" ORDER BY "createdAt" DESC`);
  return (rows || []).map(rowToWebhook);
}

async function create(
  params: Omit<NotificationWebhook, 'notificationWebhookId' | 'createdAt' | 'updatedAt'>,
): Promise<NotificationWebhook | null> {
  const now = new Date();
  let name = 'webhook';
  try {
    name = new URL(params.url).hostname;
  } catch {
    /* keep default name */
  }
  return queryOne<DbNotificationWebhook>(
    `INSERT INTO "notificationWebhook" (name, url, secret, events, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, params.url, params.secret || null, JSON.stringify(params.events), params.isActive, now, now],
  ).then(row => (row ? rowToWebhook(row) : null));
}

async function deactivate(notificationWebhookId: string): Promise<void> {
  await query(`UPDATE "notificationWebhook" SET "isActive" = false, "updatedAt" = $1 WHERE "notificationWebhookId" = $2`, [
    new Date(),
    notificationWebhookId,
  ]);
}

async function findAll(): Promise<NotificationWebhook[]> {
  const rows = await query<DbNotificationWebhook[]>(`SELECT * FROM "notificationWebhook" ORDER BY "createdAt" DESC`);
  return (rows || []).map(rowToWebhook);
}

export default { findActive, findByMerchant, create, deactivate, findAll };
