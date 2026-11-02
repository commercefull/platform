import { query, queryOne } from '../../../../libs/db';
import type { NotificationBatch as DbNotificationBatch } from '../../../../libs/db/types';
import type { NotificationBatch } from '../../domain/repositories/NotificationBatchRepository';

// Map notification types to batch types (orderStatus, promotion, accountAlert)
const BATCH_TYPE_GROUPS: Record<string, string[]> = {
  orderStatus: ['order_confirmation', 'order_shipped', 'order_delivered', 'order_cancelled', 'return_initiated', 'refund_processed'],
  promotion: ['promotion', 'coupon_offer', 'back_in_stock', 'price_drop', 'new_product'],
  accountAlert: ['account_registration', 'password_reset', 'email_verification', 'review_request', 'abandoned_cart'],
};

function mapNotificationTypeToBatchType(type: string): string {
  for (const [batchType, types] of Object.entries(BATCH_TYPE_GROUPS)) {
    if (types.includes(type)) return batchType;
  }
  return type;
}

function rowToBatch(row: DbNotificationBatch): NotificationBatch {
  return {
    notificationBatchId: row.notificationBatchId,
    name: row.name,
    type: row.type,
    channel: row.channel,
    status: row.status,
    targetCount: row.targetCount ?? 0,
    sentCount: row.sentCount ?? 0,
    failedCount: row.failedCount ?? 0,
    scheduledAt: row.scheduledAt ?? undefined,
    startedAt: row.startedAt ?? undefined,
    completedAt: row.completedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function create(
  params: Pick<NotificationBatch, 'name' | 'type' | 'channel' | 'targetCount' | 'scheduledAt'>,
): Promise<NotificationBatch | null> {
  const now = new Date();
  const mappedChannel = params.channel === 'in_app' ? 'inApp' : params.channel;
  const mappedType = mapNotificationTypeToBatchType(params.type);
  return queryOne<DbNotificationBatch>(
    `INSERT INTO "notificationBatch" (name, type, channel, status, "targetCount", "sentCount", "failedCount", "scheduledAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'draft', $4, 0, 0, $5, $6, $7) RETURNING *`,
    [params.name, mappedType, mappedChannel, params.targetCount, params.scheduledAt || null, now, now],
  ).then(row => (row ? rowToBatch(row) : null));
}

async function findById(notificationBatchId: string): Promise<NotificationBatch | null> {
  const row = await queryOne<DbNotificationBatch>(`SELECT * FROM "notificationBatch" WHERE "notificationBatchId" = $1`, [
    notificationBatchId,
  ]);
  return row ? rowToBatch(row) : null;
}

async function updateProgress(notificationBatchId: string, sentCount: number, failedCount: number): Promise<void> {
  await query(`UPDATE "notificationBatch" SET "sentCount" = $1, "failedCount" = $2, "updatedAt" = $3 WHERE "notificationBatchId" = $4`, [
    sentCount,
    failedCount,
    new Date(),
    notificationBatchId,
  ]);
}

async function complete(notificationBatchId: string): Promise<void> {
  const now = new Date();
  await query(
    `UPDATE "notificationBatch" SET status = 'completed', "completedAt" = $1, "updatedAt" = $2 WHERE "notificationBatchId" = $3`,
    [now, now, notificationBatchId],
  );
}

async function findAll(limit: number = 50, offset: number = 0): Promise<NotificationBatch[]> {
  const rows = await query<DbNotificationBatch[]>(`SELECT * FROM "notificationBatch" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`, [
    limit,
    offset,
  ]);
  return (rows || []).map(rowToBatch);
}

async function count(): Promise<number> {
  const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "notificationBatch"`);
  return result ? parseInt(result.count, 10) : 0;
}

export default { create, findById, updateProgress, complete, findAll, count };
