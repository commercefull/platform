/**
 * Token Repository Port
 *
 * Domain interface for refresh tokens and token blacklist management.
 */

export interface RefreshTokenInfo {
  token: string;
  userType: string;
  userId: string;
  isRevoked: boolean;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface TokenBlacklistInfo {
  token: string;
  userId: string;
  userType: string;
  reason?: string;
  expiresAt: Date;
}

export interface TokenRepository {
  // Refresh tokens
  createRefreshToken(params: {
    token: string;
    userType: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<RefreshTokenInfo>;
  findRefreshToken(token: string): Promise<RefreshTokenInfo | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<number>;

  // Token blacklist
  blacklistToken(params: {
    token: string;
    userId: string;
    userType: string;
    reason?: string;
    expiresAt?: Date;
  }): Promise<TokenBlacklistInfo>;
  isBlacklisted(token: string): Promise<boolean>;
  cleanExpiredBlacklist(): Promise<number>;
}
