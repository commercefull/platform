import { query, queryOne } from '../../../../libs/db';

export async function findByUserId(userId: string, limit: number, offset: number): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT * FROM "notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
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
  return await queryOne<unknown>(`SELECT * FROM "notificationPreference" WHERE "userId" = $1`, [userId]);
}

export async function upsertPreferences(
  userId: string,
  prefs: { emailOrderUpdates: boolean; emailPromotions: boolean; emailNewsletter: boolean; pushEnabled: boolean },
): Promise<void> {
  await query(
    `INSERT INTO "notificationPreference" ("userId", "emailOrderUpdates", "emailPromotions", "emailNewsletter", "pushEnabled", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT ("userId") DO UPDATE SET
       "emailOrderUpdates" = $2, "emailPromotions" = $3, "emailNewsletter" = $4,
       "pushEnabled" = $5, "updatedAt" = NOW()`,
    [userId, prefs.emailOrderUpdates, prefs.emailPromotions, prefs.emailNewsletter, prefs.pushEnabled],
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
