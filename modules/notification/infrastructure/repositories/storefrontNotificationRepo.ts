import { query, queryOne } from '../../../../libs/db';
import { generateUUID as uuidv4 } from '../../../../libs/uuid';

export async function findByUserId(userId: string, limit: number, offset: number): Promise<unknown[]> {
  const results = await query<unknown[]>(`SELECT * FROM "notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`, [
    userId,
    limit,
    offset,
  ]);
  return results || [];
}

export async function countByUserId(userId: string): Promise<number> {
  const result = await queryOne<{ total: string }>(`SELECT COUNT(*) as total FROM "notification" WHERE "userId" = $1`, [userId]);
  return result ? parseInt(result.total, 10) : 0;
}

export async function countUnreadByUserId(userId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "notification" WHERE "userId" = $1 AND "readAt" IS NULL`,
    [userId],
  );
  return result ? parseInt(result.count, 10) : 0;
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await query(`UPDATE "notification" SET "readAt" = NOW() WHERE "notificationId" = $1 AND "userId" = $2`, [notificationId, userId]);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await query(`UPDATE "notification" SET "readAt" = NOW() WHERE "userId" = $1 AND "readAt" IS NULL`, [userId]);
}

export async function getPreferences(userId: string): Promise<unknown | null> {
  const row = await queryOne<{ channelPreferences: Record<string, boolean> }>(
    `SELECT "channelPreferences" FROM "notificationPreference" WHERE "userId" = $1 AND "userType" = 'customer' AND "type" = 'general'`,
    [userId],
  );
  return row?.channelPreferences ?? null;
}

export async function upsertPreferences(
  userId: string,
  prefs: { emailOrderUpdates: boolean; emailPromotions: boolean; emailNewsletter: boolean; pushEnabled: boolean },
): Promise<void> {
  await query(
    `INSERT INTO "notificationPreference" ("notificationPreferenceId", "userId", "userType", "type", "channelPreferences", "isEnabled", "updatedAt")
     VALUES ($1, $2, 'customer', 'general', $3::jsonb, true, NOW())
     ON CONFLICT ("userId", "userType", "type") DO UPDATE SET
       "channelPreferences" = $3::jsonb, "updatedAt" = NOW()`,
    [uuidv4(), userId, JSON.stringify(prefs)],
  );
}

export default {
  findByUserId,
  countByUserId,
  countUnreadByUserId,
  markAsRead,
  markAllAsRead,
  getPreferences,
  upsertPreferences,
};
