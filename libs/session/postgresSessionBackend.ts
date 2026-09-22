/**
 * Postgres session backend — persists to the `identityUserSession` table.
 */

import { generateUUID as uuidv4 } from '../uuid';
import { query, queryOne } from '../db';
import type { CreateSessionInput, SessionBackend, SessionData } from './types';

export class PostgresSessionBackend implements SessionBackend {
  readonly kind = 'postgres' as const;
  private readonly tableName = 'identityUserSession';
  private readonly defaultExpiryHours = 8;

  async createSession(input: CreateSessionInput): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (input.expiresInHours || this.defaultExpiryHours) * 60 * 60 * 1000);

    const sql = `
      INSERT INTO "${this.tableName}"
        ("sessionId", "userId", "userType", "email", "name", "role",
         "organizationId", "companyId", "storeId", "storeRole", "storeIds", "permissions", "expiresAt",
         "createdAt", "lastActivityAt", "userAgent", "ipAddress")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING "sessionId"
    `;

    await query(sql, [
      sessionId,
      input.userId,
      input.userType,
      input.email,
      input.name || null,
      input.role || null,
      input.organizationId || null,
      input.companyId || null,
      input.storeId || null,
      input.storeRole || null,
      JSON.stringify(input.storeIds || []),
      JSON.stringify(input.permissions || []),
      expiresAt,
      now,
      now,
      input.userAgent || null,
      input.ipAddress || null,
    ]);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sql = `
      SELECT "sessionId", "userId", "userType", "email", "name", "role",
             "organizationId", "companyId", "storeId", "storeRole", "storeIds", "permissions", "expiresAt",
             "createdAt", "lastActivityAt", "userAgent", "ipAddress"
      FROM "${this.tableName}"
      WHERE "sessionId" = $1 AND "expiresAt" > NOW()
    `;

    const result = await queryOne<SessionData>(sql, [sessionId]);
    if (result) {
      result.storeIds = Array.isArray(result.storeIds)
        ? result.storeIds
        : result.storeIds
          ? JSON.parse(result.storeIds as unknown as string)
          : [];
      result.permissions = result.permissions || [];
    }
    return result;
  }

  async updateActivity(sessionId: string): Promise<void> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "lastActivityAt" = NOW()
      WHERE "sessionId" = $1
    `;
    await query(sql, [sessionId]);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const sql = `
      DELETE FROM "${this.tableName}"
      WHERE "sessionId" = $1
    `;
    await query(sql, [sessionId]);
  }

  async invalidateUserSessions(userId: string, userType: string): Promise<void> {
    const sql = `
      DELETE FROM "${this.tableName}"
      WHERE "userId" = $1 AND "userType" = $2
    `;
    await query(sql, [userId, userType]);
  }

  async cleanupExpiredSessions(): Promise<number> {
    const sql = `
      DELETE FROM "${this.tableName}"
      WHERE "expiresAt" < NOW()
    `;
    const result = (await query(sql)) as { rowCount?: number } | null;
    return result?.rowCount || 0;
  }

  async extendSession(sessionId: string, additionalHours: number): Promise<void> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "expiresAt" = "expiresAt" + INTERVAL '${additionalHours} hours',
          "lastActivityAt" = NOW()
      WHERE "sessionId" = $1
    `;
    await query(sql, [sessionId]);
  }

  async getUserSessions(userId: string, userType: string): Promise<SessionData[]> {
    const sql = `
      SELECT "sessionId", "userId", "userType", "email", "name", "role",
             "organizationId", "companyId", "storeId", "storeRole", "storeIds", "permissions", "expiresAt",
             "createdAt", "lastActivityAt", "userAgent", "ipAddress"
      FROM "${this.tableName}"
      WHERE "userId" = $1 AND "userType" = $2 AND "expiresAt" > NOW()
      ORDER BY "lastActivityAt" DESC
    `;
    const sessions = (await query<SessionData[]>(sql, [userId, userType])) || [];
    return sessions.map(session => ({
      ...session,
      storeIds: Array.isArray(session.storeIds)
        ? session.storeIds
        : session.storeIds
          ? JSON.parse(session.storeIds as unknown as string)
          : [],
      permissions: session.permissions || [],
    }));
  }
}
