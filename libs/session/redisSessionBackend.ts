/**
 * Redis session backend — same records as PostgresSessionBackend, stored
 * as JSON keys with native TTL expiry.
 *
 * Key layout:
 *   isession:<sessionId>                 → SessionData JSON (PX = expiresAt - now)
 *   isession:user:<userType>:<userId>    → SET of sessionIds (user index)
 */

import type Redis from 'ioredis';
import { generateUUID as uuidv4 } from '../uuid';
import type { CreateSessionInput, SessionBackend, SessionData } from './types';

const SESSION_PREFIX = 'isession:';
const USER_PREFIX = 'isession:user:';

interface StoredSession extends Omit<SessionData, 'expiresAt' | 'createdAt' | 'lastActivityAt'> {
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
}

export class RedisSessionBackend implements SessionBackend {
  readonly kind = 'redis' as const;
  private readonly defaultExpiryHours = 8;

  constructor(private readonly client: Redis) {}

  private sessionKey(sessionId: string): string {
    return `${SESSION_PREFIX}${sessionId}`;
  }

  private userKey(userId: string, userType: string): string {
    return `${USER_PREFIX}${userType}:${userId}`;
  }

  private revive(stored: StoredSession): SessionData {
    return {
      ...stored,
      expiresAt: new Date(stored.expiresAt),
      createdAt: new Date(stored.createdAt),
      lastActivityAt: new Date(stored.lastActivityAt),
      storeIds: stored.storeIds || [],
      permissions: stored.permissions || [],
    };
  }

  async createSession(input: CreateSessionInput): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (input.expiresInHours || this.defaultExpiryHours) * 60 * 60 * 1000);

    const data: StoredSession = {
      sessionId,
      userId: input.userId,
      userType: input.userType,
      email: input.email,
      name: input.name,
      role: input.role,
      organizationId: input.organizationId,
      companyId: input.companyId,
      storeId: input.storeId,
      storeRole: input.storeRole,
      storeIds: input.storeIds || [],
      permissions: input.permissions || [],
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      lastActivityAt: now.toISOString(),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    };

    const ttlMs = expiresAt.getTime() - now.getTime();
    await this.client
      .multi()
      .set(this.sessionKey(sessionId), JSON.stringify(data), 'PX', ttlMs)
      .sadd(this.userKey(input.userId, input.userType), sessionId)
      .exec();

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const raw = await this.client.get(this.sessionKey(sessionId));
    if (!raw) return null;
    const session = this.revive(JSON.parse(raw) as StoredSession);
    if (session.expiresAt.getTime() <= Date.now()) return null;
    return session;
  }

  async updateActivity(sessionId: string): Promise<void> {
    const raw = await this.client.get(this.sessionKey(sessionId));
    if (!raw) return;
    const data = JSON.parse(raw) as StoredSession;
    data.lastActivityAt = new Date().toISOString();
    // KEEPTTL preserves the remaining expiry instead of resetting it
    await this.client.set(this.sessionKey(sessionId), JSON.stringify(data), 'KEEPTTL');
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const raw = await this.client.get(this.sessionKey(sessionId));
    const multi = this.client.multi().del(this.sessionKey(sessionId));
    if (raw) {
      const data = JSON.parse(raw) as StoredSession;
      multi.srem(this.userKey(data.userId, data.userType), sessionId);
    }
    await multi.exec();
  }

  async invalidateUserSessions(userId: string, userType: string): Promise<void> {
    const userKey = this.userKey(userId, userType);
    const sessionIds = await this.client.smembers(userKey);
    const multi = this.client.multi().del(userKey);
    for (const sid of sessionIds) {
      multi.del(this.sessionKey(sid));
    }
    await multi.exec();
  }

  async getUserSessions(userId: string, userType: string): Promise<SessionData[]> {
    const sessionIds = await this.client.smembers(this.userKey(userId, userType));
    if (sessionIds.length === 0) return [];

    const raws = await this.client.mget(sessionIds.map(sid => this.sessionKey(sid)));
    const now = Date.now();
    const sessions: SessionData[] = [];

    for (const raw of raws) {
      if (!raw) continue;
      const session = this.revive(JSON.parse(raw) as StoredSession);
      if (session.expiresAt.getTime() > now) sessions.push(session);
    }

    sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
    return sessions;
  }

  async extendSession(sessionId: string, additionalHours: number): Promise<void> {
    const raw = await this.client.get(this.sessionKey(sessionId));
    if (!raw) return;
    const data = JSON.parse(raw) as StoredSession;
    const newExpiry = new Date(data.expiresAt).getTime() + additionalHours * 60 * 60 * 1000;
    data.expiresAt = new Date(newExpiry).toISOString();
    data.lastActivityAt = new Date().toISOString();

    const ttlMs = newExpiry - Date.now();
    if (ttlMs <= 0) {
      await this.client.del(this.sessionKey(sessionId));
      return;
    }
    await this.client.set(this.sessionKey(sessionId), JSON.stringify(data), 'PX', ttlMs);
  }

  async cleanupExpiredSessions(): Promise<number> {
    // Redis expires keys natively — nothing to sweep.
    return 0;
  }
}
