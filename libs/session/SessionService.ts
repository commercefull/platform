/**
 * Session Service — facade over the configured session backend.
 * Postgres (identityUserSession table) by default; Redis when
 * REDIS_URL/REDIS_HOST is configured. See libs/session/index.ts.
 */

import { createSessionBackend } from './createSessionBackend';
import type { CreateSessionInput, SessionBackend, SessionData } from './types';

export type { SessionData, CreateSessionInput } from './types';

class SessionServiceClass {
  private readonly backend: SessionBackend = createSessionBackend();

  async createSession(input: CreateSessionInput): Promise<string> {
    return this.backend.createSession(input);
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.backend.getSession(sessionId);
  }

  async updateActivity(sessionId: string): Promise<void> {
    return this.backend.updateActivity(sessionId);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    return this.backend.invalidateSession(sessionId);
  }

  async invalidateUserSessions(userId: string, userType: string): Promise<void> {
    return this.backend.invalidateUserSessions(userId, userType);
  }

  async cleanupExpiredSessions(): Promise<number> {
    return this.backend.cleanupExpiredSessions();
  }

  async extendSession(sessionId: string, additionalHours: number): Promise<void> {
    return this.backend.extendSession(sessionId, additionalHours);
  }

  async getUserSessions(userId: string, userType: string): Promise<SessionData[]> {
    return this.backend.getUserSessions(userId, userType);
  }
}

export const SessionService = new SessionServiceClass();
