import { query, queryOne } from '../../../../libs/db';

export interface NotificationPreference {
  notificationPreferenceId: string;
  userId: string;
  userType: string;
  channel: string;
  type: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByUser(userId: string, userType: string): Promise<NotificationPreference[]> {
  return (await query<NotificationPreference[]>(
    `SELECT * FROM "notificationPreference" WHERE "userId" = $1 AND "userType" = $2`,
    [userId, userType],
  )) || [];
}

export async function upsert(params: Omit<NotificationPreference, 'notificationPreferenceId' | 'createdAt' | 'updatedAt'>): Promise<NotificationPreference | null> {
  const now = new Date();
  return queryOne<NotificationPreference>(
    `INSERT INTO "notificationPreference" ("userId", "userType", channel, type, "isEnabled", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("userId", channel, type) DO UPDATE SET "isEnabled" = $5, "updatedAt" = $7
     RETURNING *`,
    [params.userId, params.userType, params.channel, params.type, params.isEnabled, now, now],
  );
}

export async function deleteByUser(userId: string): Promise<void> {
  await query(`DELETE FROM "notificationPreference" WHERE "userId" = $1`, [userId]);
}

export default { findByUser, upsert, deleteByUser };
