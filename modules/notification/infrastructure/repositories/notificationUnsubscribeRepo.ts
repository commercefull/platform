import { query, queryOne } from '../../../../libs/db';

export interface NotificationUnsubscribe {
  notificationUnsubscribeId: string;
  userId: string;
  category?: string;
  reason?: string;
  isGlobal?: boolean;
  createdAt: Date;
}

export async function isUnsubscribed(userId: string, channel: string, type?: string): Promise<boolean> {
  const category = type || channel;
  const sql = category
    ? `SELECT 1 FROM "notificationUnsubscribe" WHERE "userId" = $1 AND (category = $2 OR "isGlobal" = true) LIMIT 1`
    : `SELECT 1 FROM "notificationUnsubscribe" WHERE "userId" = $1 AND "isGlobal" = true LIMIT 1`;
  const params = category ? [userId, category] : [userId];
  const result = await queryOne<{ '?column?': number }>(sql, params);
  return !!result;
}

export async function unsubscribe(params: Omit<NotificationUnsubscribe, 'notificationUnsubscribeId' | 'createdAt'>): Promise<void> {
  await query(
    `INSERT INTO "notificationUnsubscribe" ("userId", category, reason, "isGlobal", "createdAt")
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
    [params.userId, params.category || null, params.reason || null, false, new Date()],
  );
}

export async function resubscribe(userId: string, channel: string, type?: string): Promise<void> {
  const category = type || channel;
  const sql = category
    ? `DELETE FROM "notificationUnsubscribe" WHERE "userId" = $1 AND category = $2`
    : `DELETE FROM "notificationUnsubscribe" WHERE "userId" = $1`;
  const params = category ? [userId, category] : [userId];
  await query(sql, params);
}

export async function findByUser(userId: string): Promise<NotificationUnsubscribe[]> {
  return (
    (await query<NotificationUnsubscribe[]>(`SELECT * FROM "notificationUnsubscribe" WHERE "userId" = $1 ORDER BY "createdAt" DESC`, [
      userId,
    ])) || []
  );
}

export default { isUnsubscribed, unsubscribe, resubscribe, findByUser };
