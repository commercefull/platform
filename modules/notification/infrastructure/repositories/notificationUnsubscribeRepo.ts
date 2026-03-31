import { query, queryOne } from '../../../../libs/db';

export interface NotificationUnsubscribe {
  notificationUnsubscribeId: string;
  userId: string;
  userType: string;
  channel: string;
  type?: string;
  reason?: string;
  createdAt: Date;
}

export async function isUnsubscribed(userId: string, channel: string, type?: string): Promise<boolean> {
  const sql = type
    ? `SELECT 1 FROM "notificationUnsubscribe" WHERE "userId" = $1 AND channel = $2 AND (type = $3 OR type IS NULL) LIMIT 1`
    : `SELECT 1 FROM "notificationUnsubscribe" WHERE "userId" = $1 AND channel = $2 LIMIT 1`;
  const params = type ? [userId, channel, type] : [userId, channel];
  const result = await queryOne<{ '?column?': number }>(sql, params);
  return !!result;
}

export async function unsubscribe(params: Omit<NotificationUnsubscribe, 'notificationUnsubscribeId' | 'createdAt'>): Promise<void> {
  await query(
    `INSERT INTO "notificationUnsubscribe" ("userId", "userType", channel, type, reason, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
    [params.userId, params.userType, params.channel, params.type || null, params.reason || null, new Date()],
  );
}

export async function resubscribe(userId: string, channel: string, type?: string): Promise<void> {
  const sql = type
    ? `DELETE FROM "notificationUnsubscribe" WHERE "userId" = $1 AND channel = $2 AND type = $3`
    : `DELETE FROM "notificationUnsubscribe" WHERE "userId" = $1 AND channel = $2`;
  const params = type ? [userId, channel, type] : [userId, channel];
  await query(sql, params);
}

export async function findByUser(userId: string): Promise<NotificationUnsubscribe[]> {
  return (await query<NotificationUnsubscribe[]>(
    `SELECT * FROM "notificationUnsubscribe" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    [userId],
  )) || [];
}

export default { isUnsubscribed, unsubscribe, resubscribe, findByUser };
