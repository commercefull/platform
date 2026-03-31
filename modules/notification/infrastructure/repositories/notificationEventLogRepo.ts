import { query, queryOne } from '../../../../libs/db';

export interface NotificationEventLog {
  notificationEventLogId: string;
  eventType: string;
  entityId?: string;
  entityType?: string;
  payload?: Record<string, any>;
  processedAt?: Date;
  createdAt: Date;
}

export async function create(params: Omit<NotificationEventLog, 'notificationEventLogId' | 'createdAt'>): Promise<NotificationEventLog | null> {
  return queryOne<NotificationEventLog>(
    `INSERT INTO "notificationEventLog" ("eventType", "entityId", "entityType", payload, "processedAt", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [params.eventType, params.entityId || null, params.entityType || null, params.payload ? JSON.stringify(params.payload) : null, params.processedAt || null, new Date()],
  );
}

export async function findUnprocessed(limit = 100): Promise<NotificationEventLog[]> {
  return (await query<NotificationEventLog[]>(
    `SELECT * FROM "notificationEventLog" WHERE "processedAt" IS NULL ORDER BY "createdAt" ASC LIMIT $1`,
    [limit],
  )) || [];
}

export async function markProcessed(notificationEventLogId: string): Promise<void> {
  await query(`UPDATE "notificationEventLog" SET "processedAt" = $1 WHERE "notificationEventLogId" = $2`, [new Date(), notificationEventLogId]);
}

export default { create, findUnprocessed, markProcessed };
