import { query, queryOne } from '../../../../libs/db';

export interface NotificationBatch {
  notificationBatchId: string;
  name: string;
  type: string;
  channel: string;
  status: string;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function create(
  params: Pick<NotificationBatch, 'name' | 'type' | 'channel' | 'targetCount' | 'scheduledAt'>,
): Promise<NotificationBatch | null> {
  const now = new Date();
  const mappedChannel = params.channel === 'in_app' ? 'inApp' : params.channel;
  // Map notification types to batch types (orderStatus, promotion, accountAlert)
  const mappedType =
    params.type === 'order_confirmation' || params.type === 'order_shipped' || params.type === 'order_delivered' || params.type === 'order_cancelled' || params.type === 'return_initiated' || params.type === 'refund_processed'
      ? 'orderStatus'
      : params.type === 'promotion' || params.type === 'coupon_offer' || params.type === 'back_in_stock' || params.type === 'price_drop' || params.type === 'new_product'
        ? 'promotion'
        : params.type === 'account_registration' || params.type === 'password_reset' || params.type === 'email_verification' || params.type === 'review_request' || params.type === 'abandoned_cart'
          ? 'accountAlert'
          : params.type;
  return queryOne<NotificationBatch>(
    `INSERT INTO "notificationBatch" (name, type, channel, status, "targetCount", "sentCount", "failedCount", "scheduledAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'draft', $4, 0, 0, $5, $6, $7) RETURNING *`,
    [params.name, mappedType, mappedChannel, params.targetCount, params.scheduledAt || null, now, now],
  );
}

export async function findById(notificationBatchId: string): Promise<NotificationBatch | null> {
  return queryOne<NotificationBatch>(`SELECT * FROM "notificationBatch" WHERE "notificationBatchId" = $1`, [notificationBatchId]);
}

export async function updateProgress(notificationBatchId: string, sentCount: number, failedCount: number): Promise<void> {
  await query(`UPDATE "notificationBatch" SET "sentCount" = $1, "failedCount" = $2, "updatedAt" = $3 WHERE "notificationBatchId" = $4`, [
    sentCount,
    failedCount,
    new Date(),
    notificationBatchId,
  ]);
}

export async function complete(notificationBatchId: string): Promise<void> {
  const now = new Date();
  await query(
    `UPDATE "notificationBatch" SET status = 'completed', "completedAt" = $1, "updatedAt" = $2 WHERE "notificationBatchId" = $3`,
    [now, now, notificationBatchId],
  );
}

export async function findAll(limit: number = 50, offset: number = 0): Promise<NotificationBatch[]> {
  return (
    (await query<NotificationBatch[]>(`SELECT * FROM "notificationBatch" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`, [limit, offset])) ||
    []
  );
}

export async function count(): Promise<number> {
  const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "notificationBatch"`);
  return result ? parseInt(result.count, 10) : 0;
}

export default { create, findById, updateProgress, complete, findAll, count };
