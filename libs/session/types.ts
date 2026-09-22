export interface SessionData {
  sessionId: string;
  userId: string;
  userType: 'admin' | 'organization' | 'b2b' | 'customer';
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
  companyId?: string;
  storeId?: string;
  storeRole?: string;
  storeIds?: string[];
  permissions: string[];
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface CreateSessionInput {
  userId: string;
  userType: 'admin' | 'organization' | 'b2b' | 'customer';
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
  companyId?: string;
  storeId?: string;
  storeRole?: string;
  storeIds?: string[];
  permissions?: string[];
  userAgent?: string;
  ipAddress?: string;
  expiresInHours?: number;
}

/**
 * Session backend port — identity user sessions, backend-agnostic.
 * Postgres backend persists to `identityUserSession`; Redis backend
 * stores the same records as JSON keys with native TTL expiry.
 */
export interface SessionBackend {
  readonly kind: 'postgres' | 'redis';

  createSession(input: CreateSessionInput): Promise<string>;
  getSession(sessionId: string): Promise<SessionData | null>;
  updateActivity(sessionId: string): Promise<void>;
  invalidateSession(sessionId: string): Promise<void>;
  invalidateUserSessions(userId: string, userType: string): Promise<void>;
  getUserSessions(userId: string, userType: string): Promise<SessionData[]>;
  extendSession(sessionId: string, additionalHours: number): Promise<void>;
  /** Postgres: deletes expired rows. Redis: no-op (native TTL) — returns 0. */
  cleanupExpiredSessions(): Promise<number>;
}
