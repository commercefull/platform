import { query, queryOne } from '../../../../libs/db';

export interface NotificationPreference {
  notificationPreferenceId: string;
  userId: string;
  userType: string;
  type: string;
  channelPreferences: Record<string, boolean>;
  isEnabled: boolean;
  schedulePreferences?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  updatedAt: Date;
}

export type NotificationPreferenceUpsertParams = Omit<
  NotificationPreference,
  'notificationPreferenceId' | 'updatedAt'
>;

export async function findByUser(userId: string, userType: string): Promise<NotificationPreference[]> {
  return (
    (await query<NotificationPreference[]>(
      `SELECT * FROM "notificationPreference" WHERE "userId" = $1 AND "userType" = $2 ORDER BY "updatedAt" DESC`,
      [userId, userType],
    )) || []
  );
}

export async function findById(notificationPreferenceId: string): Promise<NotificationPreference | null> {
  return queryOne<NotificationPreference>(
    `SELECT * FROM "notificationPreference" WHERE "notificationPreferenceId" = $1`,
    [notificationPreferenceId],
  );
}

export async function findByUserAndType(
  userId: string,
  userType: string,
  type: string,
): Promise<NotificationPreference | null> {
  return queryOne<NotificationPreference>(
    `SELECT * FROM "notificationPreference" WHERE "userId" = $1 AND "userType" = $2 AND "type" = $3`,
    [userId, userType, type],
  );
}

export async function findAll(): Promise<NotificationPreference[]> {
  return (await query<NotificationPreference[]>(`SELECT * FROM "notificationPreference" ORDER BY "updatedAt" DESC`)) || [];
}

export async function upsert(params: NotificationPreferenceUpsertParams): Promise<NotificationPreference | null> {
  const now = new Date().toISOString();
  return queryOne<NotificationPreference>(
    `INSERT INTO "notificationPreference" ("userId", "userType", "type", "channelPreferences", "isEnabled", "schedulePreferences", "metadata", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT ("userId", "userType", "type") DO UPDATE SET
       "channelPreferences" = EXCLUDED."channelPreferences",
       "isEnabled" = EXCLUDED."isEnabled",
       "schedulePreferences" = EXCLUDED."schedulePreferences",
       "metadata" = EXCLUDED."metadata",
       "updatedAt" = EXCLUDED."updatedAt"
     RETURNING *`,
    [
      params.userId,
      params.userType,
      params.type,
      JSON.stringify(params.channelPreferences || {}),
      params.isEnabled,
      params.schedulePreferences ? JSON.stringify(params.schedulePreferences) : null,
      params.metadata ? JSON.stringify(params.metadata) : null,
      now,
    ],
  );
}

export async function update(
  notificationPreferenceId: string,
  params: Partial<Omit<NotificationPreference, 'notificationPreferenceId' | 'userId' | 'userType' | 'type' | 'updatedAt'>>,
): Promise<NotificationPreference | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.channelPreferences !== undefined) {
    setClauses.push(`"channelPreferences" = $${idx++}`);
    values.push(JSON.stringify(params.channelPreferences));
  }
  if (params.isEnabled !== undefined) {
    setClauses.push(`"isEnabled" = $${idx++}`);
    values.push(params.isEnabled);
  }
  if (params.schedulePreferences !== undefined) {
    setClauses.push(`"schedulePreferences" = $${idx++}`);
    values.push(params.schedulePreferences ? JSON.stringify(params.schedulePreferences) : null);
  }
  if (params.metadata !== undefined) {
    setClauses.push(`"metadata" = $${idx++}`);
    values.push(params.metadata ? JSON.stringify(params.metadata) : null);
  }

  if (setClauses.length === 0) {
    return findById(notificationPreferenceId);
  }

  setClauses.push(`"updatedAt" = $${idx++}`);
  values.push(new Date().toISOString());
  values.push(notificationPreferenceId);

  return queryOne<NotificationPreference>(
    `UPDATE "notificationPreference" SET ${setClauses.join(', ')} WHERE "notificationPreferenceId" = $${idx} RETURNING *`,
    values,
  );
}

export async function deleteById(notificationPreferenceId: string): Promise<boolean> {
  const result = await queryOne<{ notificationPreferenceId: string }>(
    `DELETE FROM "notificationPreference" WHERE "notificationPreferenceId" = $1 RETURNING "notificationPreferenceId"`,
    [notificationPreferenceId],
  );
  return !!result;
}

export async function deleteByUser(userId: string): Promise<void> {
  await query(`DELETE FROM "notificationPreference" WHERE "userId" = $1`, [userId]);
}

export async function bulkUpsert(
  userId: string,
  userType: string,
  updates: Array<{
    type: string;
    channelPreferences?: Record<string, boolean>;
    isEnabled?: boolean;
    schedulePreferences?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }>,
): Promise<{ updated: number; created: number }> {
  let updated = 0;
  let created = 0;

  for (const u of updates) {
    const existing = await findByUserAndType(userId, userType, u.type);
    const result = await upsert({
      userId,
      userType,
      type: u.type,
      channelPreferences: u.channelPreferences || {},
      isEnabled: u.isEnabled ?? true,
      schedulePreferences: u.schedulePreferences || null,
      metadata: u.metadata || null,
    });
    if (result) {
      if (existing) updated++;
      else created++;
    }
  }

  return { updated, created };
}

export default {
  findByUser,
  findById,
  findByUserAndType,
  findAll,
  upsert,
  update,
  deleteById,
  deleteByUser,
  bulkUpsert,
};
