import { query, queryOne } from '../../../../libs/db';

export interface NotificationDevice {
  notificationDeviceId: string;
  userId: string;
  userType: string;
  deviceToken: string;
  platform: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByUser(userId: string): Promise<NotificationDevice[]> {
  return (await query<NotificationDevice[]>(
    `SELECT * FROM "notificationDevice" WHERE "userId" = $1 AND "isActive" = true`,
    [userId],
  )) || [];
}

export async function upsert(params: Omit<NotificationDevice, 'notificationDeviceId' | 'createdAt' | 'updatedAt'>): Promise<NotificationDevice | null> {
  const now = new Date();
  return queryOne<NotificationDevice>(
    `INSERT INTO "notificationDevice" ("userId", "userType", "deviceToken", platform, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("deviceToken") DO UPDATE SET "userId" = $1, "isActive" = $5, "updatedAt" = $7
     RETURNING *`,
    [params.userId, params.userType, params.deviceToken, params.platform, params.isActive, now, now],
  );
}

export async function deactivate(deviceToken: string): Promise<void> {
  await query(`UPDATE "notificationDevice" SET "isActive" = false, "updatedAt" = $1 WHERE "deviceToken" = $2`, [new Date(), deviceToken]);
}

export async function deleteByUser(userId: string): Promise<void> {
  await query(`DELETE FROM "notificationDevice" WHERE "userId" = $1`, [userId]);
}

export default { findByUser, upsert, deactivate, deleteByUser };
