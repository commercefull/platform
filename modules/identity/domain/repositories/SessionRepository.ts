/**
 * Session Repository Port
 *
 * Domain interface for session management (customer + organization sessions).
 */

export interface SessionInfo {
  sessionId: string;
  sessionToken: string;
  userId: string;
  userType: 'customer' | 'organization';
  isActive: boolean;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
}

export interface SessionCreateParams {
  userId: string;
  userType: 'customer' | 'organization';
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  isActive?: boolean;
  expiresAt?: Date;
}

export interface SessionRepository {
  create(params: SessionCreateParams): Promise<SessionInfo>;
  findById(sessionId: string): Promise<SessionInfo | null>;
  findByToken(token: string): Promise<SessionInfo | null>;
  findByUserId(userId: string): Promise<SessionInfo[]>;
  updateActivity(sessionId: string): Promise<void>;
  deactivate(sessionId: string): Promise<void>;
  deactivateAllForUser(userId: string): Promise<number>;
  deleteExpired(): Promise<number>;
}
