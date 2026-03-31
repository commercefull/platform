import { query, queryOne } from '../../../../libs/db';

export interface NotificationBatch {
  notificationBatchId: string;
  name: string;
  channel: string;
  status: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function create(params: Pick<NotificationBatch, 'name' | 'channel' | 'totalCount' | 'scheduledAt'>): Promise<NotificationBatch | null> {
  const now = new Date();
  return queryOne<NotificationBatch>(
    `INSERT INTO "notificationBatch" (name, channel, status, "totalCount", "sentCount", "failedCount", "scheduledAt", "createdAt", "updatedAt")
     VALUES ($1, $2, 'pending', $3, 0, 0, $4, $5, $6) RETURNING *`,
    [params.name, params.channel, params.totalCount, params.scheduledAt || null, now, now],
  );
}

export async function findById(notificationBatchId: string): Promise<NotificationBatch | null> {
  return queryOne<NotificationBatch>(`SELECT * FROM "notificationBatch" WHERE "notificationBatchId" = $1`, [notificationBatchId]);
}

export async function updateProgress(notificationBatchId: string, sentCount: number, failedCount: number): Promise<void> {
  await query(
    `UPDATE "notificationBatch" SET "sentCount" = $1, "failedCount" = $2, "updatedAt" = $3 WHERE "notificationBatchId" = $4`,
    [sentCount, failedCount, new Date(), notificationBatchId],
  );
}

export async function complete(notificationBatchId: string): Promise<void> {
  const now = new Date();
  await query(
    `UPDATE "notificationBatch" SET status = 'completed', "completedAt" = $1, "updatedAt" = $2 WHERE "notificationBatchId" = $3`,
    [now, now, notificationBatchId],
  );
}

export default { create, findById, updateProgress, complete };
