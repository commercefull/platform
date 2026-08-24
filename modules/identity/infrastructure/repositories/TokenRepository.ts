/**
 * Consolidated Token Repository
 *
 * Merges: identityRefreshTokenRepo, identityTokenBlacklistRepo
 * Implements: TokenRepository domain port
 */

import { query, queryOne } from '../../../../libs/db';
import { IdentityRefreshTokens, IdentityTokenBlacklist } from '../../../../libs/db/types';
import {
  TokenRepository,
  RefreshTokenInfo,
  TokenBlacklistInfo,
} from '../../domain/repositories/TokenRepository';
import { FailedToCreateRefreshTokenError, FailedToCreateBlacklistEntryError } from '../../domain/errors/IdentityErrors';

export class TokenRepositoryImpl implements TokenRepository {
  // ==========================================================================
  // Refresh Tokens
  // ==========================================================================

  async createRefreshToken(params: {
    token: string;
    userType: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<RefreshTokenInfo> {
    const now = new Date();
    const record = await queryOne<IdentityRefreshTokens>(
      `INSERT INTO "identityRefreshTokens" (
        "token", "userType", "userId", "isRevoked", "expiresAt", "createdAt", "updatedAt", "userAgent", "ipAddress"
      ) VALUES ($1, $2, $3, false, $4, $5, $5, $6, $7)
      RETURNING *`,
      [params.token, params.userType, params.userId, params.expiresAt, now, params.userAgent ?? null, params.ipAddress ?? null],
    );

    if (!record) {
      throw new FailedToCreateRefreshTokenError();
    }

    return this.mapToRefreshTokenInfo(record);
  }

  async findRefreshToken(token: string): Promise<RefreshTokenInfo | null> {
    const record = await queryOne<IdentityRefreshTokens>(
      `SELECT * FROM "identityRefreshTokens"
       WHERE "token" = $1 AND "isRevoked" = false AND "expiresAt" > $2`,
      [token, new Date()],
    );

    return record ? this.mapToRefreshTokenInfo(record) : null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await queryOne<{ authRefreshTokenId: string }>(
      `UPDATE "identityRefreshTokens"
       SET "isRevoked" = true, "updatedAt" = $1
       WHERE "token" = $2 AND "isRevoked" = false
       RETURNING "authRefreshTokenId"`,
      [new Date(), token],
    );
  }

  async revokeAllForUser(userId: string): Promise<number> {
    return this.revokeAllForUserWithType(userId);
  }

  async revokeAllForUserWithType(userId: string, userType?: string): Promise<number> {
    let whereClause = `WHERE "userId" = $1 AND "isRevoked" = false`;
    const params: unknown[] = [new Date(), userId];
    if (userType) {
      whereClause += ` AND "userType" = $3`;
      params.push(userType);
    }

    await queryOne<{ rowCount: number }>(
      `UPDATE "identityRefreshTokens"
       SET "isRevoked" = true, "updatedAt" = $1
       ${whereClause}
       RETURNING "authRefreshTokenId"`,
      params,
    );

    let countQuery = `SELECT "authRefreshTokenId" FROM "identityRefreshTokens" WHERE "userId" = $1 AND "isRevoked" = true`;
    const countParams: unknown[] = [userId];
    if (userType) {
      countQuery += ` AND "userType" = $2`;
      countParams.push(userType);
    }

    const tokens = await query<IdentityRefreshTokens[]>(countQuery, countParams);

    return tokens ? tokens.length : 0;
  }

  // ==========================================================================
  // Token Blacklist
  // ==========================================================================

  async blacklistToken(params: {
    token: string;
    userId: string;
    userType: string;
    reason?: string;
    expiresAt?: Date;
  }): Promise<TokenBlacklistInfo> {
    const now = new Date();
    const expiresAt = params.expiresAt || new Date(Date.now() + 86400000);

    const record = await queryOne<IdentityTokenBlacklist>(
      `INSERT INTO "identityTokenBlacklist" (
        "token", "userType", "userId", "expiresAt", "invalidatedAt", "reason", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [params.token, params.userType, params.userId, expiresAt, now, params.reason ?? 'logout', now, now],
    );

    if (!record) {
      throw new FailedToCreateBlacklistEntryError();
    }

    return this.mapToBlacklistInfo(record);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await queryOne<IdentityTokenBlacklist>(
      `SELECT * FROM "identityTokenBlacklist"
       WHERE "token" = $1 AND "expiresAt" > $2`,
      [token, new Date()],
    );

    return !!result;
  }

  async cleanExpiredBlacklist(): Promise<number> {
    const result = await query<IdentityTokenBlacklist[]>(
      `DELETE FROM "identityTokenBlacklist"
       WHERE "expiresAt" < $1
       RETURNING "identityTokenBlacklistId"`,
      [new Date()],
    );

    return result ? result.length : 0;
  }

  // ==========================================================================
  // Extended methods (used by controllers directly)
  // ==========================================================================

  async findRefreshTokensForUser(userId: string, userType: string): Promise<IdentityRefreshTokens[]> {
    return (
      (await query<IdentityRefreshTokens[]>(
        `SELECT * FROM "identityRefreshTokens"
         WHERE "userId" = $1 AND "userType" = $2
         ORDER BY "createdAt" DESC`,
        [userId, userType],
      )) || []
    );
  }

  async markRefreshTokenUsed(token: string, usedAt: Date = new Date()): Promise<boolean> {
    const result = await queryOne<{ authRefreshTokenId: string }>(
      `UPDATE "identityRefreshTokens"
       SET "lastUsedAt" = $1, "updatedAt" = $1
       WHERE "token" = $2 AND "isRevoked" = false
       RETURNING "authRefreshTokenId"`,
      [usedAt, token],
    );

    return !!result;
  }

  async cleanupExpiredRefreshTokens(now: Date = new Date()): Promise<number> {
    const result = await query<IdentityRefreshTokens[]>(
      `DELETE FROM "identityRefreshTokens"
       WHERE "expiresAt" < $1
       RETURNING "authRefreshTokenId"`,
      [now],
    );

    return result ? result.length : 0;
  }

  async findBlacklistForUser(userId: string, userType: string): Promise<IdentityTokenBlacklist[]> {
    return (
      (await query<IdentityTokenBlacklist[]>(
        `SELECT * FROM "identityTokenBlacklist"
         WHERE "userId" = $1 AND "userType" = $2
         ORDER BY "invalidatedAt" DESC`,
        [userId, userType],
      )) || []
    );
  }

  // ==========================================================================
  // Mappers
  // ==========================================================================

  private mapToRefreshTokenInfo(record: IdentityRefreshTokens): RefreshTokenInfo {
    return {
      token: record.token,
      userType: record.userType,
      userId: record.userId,
      isRevoked: record.isRevoked,
      expiresAt: record.expiresAt,
      userAgent: record.userAgent ?? null,
      ipAddress: record.ipAddress ?? null,
    };
  }

  private mapToBlacklistInfo(record: IdentityTokenBlacklist): TokenBlacklistInfo {
    return {
      token: record.token,
      userId: record.userId,
      userType: record.userType,
      reason: record.reason ?? undefined,
      expiresAt: record.expiresAt,
    };
  }
}

export default new TokenRepositoryImpl();
