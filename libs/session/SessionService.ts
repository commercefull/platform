/**
 * Session Service
 * Database-backed session management for web applications
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';

export interface SessionData {
  sessionId: string;
  userId: string;
  userType: 'admin' | 'merchant' | 'b2b' | 'customer';
  email: string;
  name?: string;
  role?: string;
  merchantId?: string;
  companyId?: string;
  permissions: string[];
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface CreateSessionInput {
  userId: string;
  userType: 'admin' | 'merchant' | 'b2b' | 'customer';
  email: string;
  name?: string;
  role?: string;
  merchantId?: string;
  companyId?: string;
  permissions?: string[];
  userAgent?: string;
  ipAddress?: string;
  expiresInHours?: number;
}

class SessionServiceClass {
  private readonly tableName = 'userSession';
  private readonly defaultExpiryHours = 8;

  /**
   * Create a new session
   */
  async createSession(input: CreateSessionInput): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (input.expiresInHours || this.defaultExpiryHours) * 60 * 60 * 1000
    );

    const sql = `
      INSERT INTO "${this.tableName}" 
        ("sessionId", "userId", "userType", "email", "name", "role", 
         "merchantId", "companyId", "permissions", "expiresAt", 
         "createdAt", "lastActivityAt", "userAgent", "ipAddress")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING "sessionId"
    `;

    await query(sql, [
      sessionId,
      input.userId,
      input.userType,
      input.email,
      input.name || null,
      input.role || null,
      input.merchantId || null,
      input.companyId || null,
      JSON.stringify(input.permissions || []),
      expiresAt,
      now,
      now,
      input.userAgent || null,
      input.ipAddress || null,
    ]);

    return sessionId;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const sql = `
      SELECT "sessionId", "userId", "userType", "email", "name", "role",
             "merchantId", "companyId", "permissions", "expiresAt",
             "createdAt", "lastActivityAt", "userAgent", "ipAddress"
      FROM "${this.tableName}"
      WHERE "sessionId" = $1 AND "expiresAt" > NOW()
    `;

    const result = await queryOne<SessionData>(sql, [sessionId]);
    if (result) {
      result.permissions = result.permissions || [];
    }
    return result;
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string): Promise<void> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "lastActivityAt" = NOW()
      WHERE "sessionId" = $1
    `;
    await query(sql, [sessionId]);
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const sql = `
      DELETE FROM "${this.tableName}"
      WHERE "sessionId" = $1
    `;
    await query(sql, [sessionId]);
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateUserSessions(userId: string, userType: string): Promise<void> {
    const sql = `
      DELETE FROM "${this.tableName}"
      WHERE "userId" = $1 AND "userType" = $2
    `;
    await query(sql, [userId, userType]);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const sql = `
      DELETE FROM "${this.tableName}"
      WHERE "expiresAt" < NOW()
    `;
    const result = await query(sql) as any;
    return result?.rowCount || 0;
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionId: string, additionalHours: number): Promise<void> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "expiresAt" = "expiresAt" + INTERVAL '${additionalHours} hours',
          "lastActivityAt" = NOW()
      WHERE "sessionId" = $1
    `;
    await query(sql, [sessionId]);
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string, userType: string): Promise<SessionData[]> {
    const sql = `
      SELECT "sessionId", "userId", "userType", "email", "name", "role",
             "merchantId", "companyId", "permissions", "expiresAt",
             "createdAt", "lastActivityAt", "userAgent", "ipAddress"
      FROM "${this.tableName}"
      WHERE "userId" = $1 AND "userType" = $2 AND "expiresAt" > NOW()
      ORDER BY "lastActivityAt" DESC
    `;
    return (await query<SessionData[]>(sql, [userId, userType])) || [];
  }
}

export const SessionService = new SessionServiceClass();
export default SessionService;
