import type { NotificationEventLog as DbNotificationEventLog } from '../../../../libs/db/types';
import { query, queryOne } from '../../../../libs/db';

export type NotificationEventLog = DbNotificationEventLog;

export async function create(
  params: Omit<NotificationEventLog, 'notificationEventLogId' | 'createdAt'>,
): Promise<NotificationEventLog | null> {
  return queryOne<NotificationEventLog>(
    `INSERT INTO "notificationEventLog" ("notificationId", "deliveryLogId", "userId", "userType", "eventType", "eventData", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      params.notificationId || null,
      params.deliveryLogId || null,
      params.userId || null,
      params.userType || null,
      params.eventType,
      params.eventData
        ? JSON.stringify(params.eventData)
        : (params as Record<string, unknown>).payload
          ? JSON.stringify((params as Record<string, unknown>).payload)
          : null,
      new Date(),
    ],
  );
}

export async function findUnprocessed(limit = 100): Promise<NotificationEventLog[]> {
  return (await query<NotificationEventLog[]>(`SELECT * FROM "notificationEventLog" ORDER BY "createdAt" ASC LIMIT $1`, [limit])) || [];
}

export async function markProcessed(notificationEventLogId: string): Promise<void> {
  await query(`UPDATE "notificationEventLog" SET "eventType" = $1 WHERE "notificationEventLogId" = $2`, [
    'processed',
    notificationEventLogId,
  ]);
}

export default { create, findUnprocessed, markProcessed };
