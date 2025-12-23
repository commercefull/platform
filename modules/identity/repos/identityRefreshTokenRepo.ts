import { query, queryOne } from '../../../libs/db';
import { IdentityRefreshTokens } from '../../../libs/db/types';

export interface AuthRefreshTokenCreateParams {
  token: string;
  userType: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export class AuthRefreshTokenRepo {
  async create(params: AuthRefreshTokenCreateParams): Promise<IdentityRefreshTokens> {
    const now = new Date();
    const record = await queryOne<IdentityRefreshTokens>(
      `INSERT INTO "public"."identityRefreshTokens" (
        "token", "userType", "userId", "isRevoked", "expiresAt", "createdAt", "updatedAt", "userAgent", "ipAddress"
      ) VALUES ($1, $2, $3, false, $4, $5, $5, $6, $7)
      RETURNING *`,
      [params.token, params.userType, params.userId, params.expiresAt, now, params.userAgent ?? null, params.ipAddress ?? null],
    );

    if (!record) {
      throw new Error('Failed to create auth refresh token');
    }

    return record;
  }

  async findValidByToken(token: string): Promise<IdentityRefreshTokens | null> {
    return queryOne<IdentityRefreshTokens>(
      `SELECT * FROM "public"."identityRefreshTokens"
       WHERE "token" = $1 AND "isRevoked" = false AND "expiresAt" > $2`,
      [token, new Date()],
    );
  }

  async findForUser(userId: string, userType: string): Promise<IdentityRefreshTokens[]> {
    return (
      (await query<IdentityRefreshTokens[]>(
        `SELECT * FROM "public"."identityRefreshTokens"
       WHERE "userId" = $1 AND "userType" = $2
       ORDER BY "createdAt" DESC`,
        [userId, userType],
      )) || []
    );
  }

  async markUsed(token: string, usedAt: Date = new Date()): Promise<boolean> {
    const result = await queryOne<{ authRefreshTokenId: string }>(
      `UPDATE "public"."identityRefreshTokens"
       SET "lastUsedAt" = $1, "updatedAt" = $1
       WHERE "token" = $2 AND "isRevoked" = false
       RETURNING "authRefreshTokenId"`,
      [usedAt, token],
    );

    return !!result;
  }

  async revoke(token: string): Promise<boolean> {
    const result = await queryOne<{ authRefreshTokenId: string }>(
      `UPDATE "public"."identityRefreshTokens"
       SET "isRevoked" = true, "updatedAt" = $1
       WHERE "token" = $2 AND "isRevoked" = false
       RETURNING "authRefreshTokenId"`,
      [new Date(), token],
    );

    return !!result;
  }

  async revokeAllForUser(userId: string, userType: string): Promise<number> {
    const result = await queryOne<{ rowCount: number }>(
      `UPDATE "public"."identityRefreshTokens"
       SET "isRevoked" = true, "updatedAt" = $1
       WHERE "userId" = $2 AND "userType" = $3 AND "isRevoked" = false
       RETURNING "authRefreshTokenId"`,
      [new Date(), userId, userType],
    );

    const tokens = await query<IdentityRefreshTokens[]>(
      `SELECT "authRefreshTokenId" FROM "public"."identityRefreshTokens"
       WHERE "userId" = $1 AND "userType" = $2 AND "isRevoked" = true`,
      [userId, userType],
    );

    return tokens ? tokens.length : 0;
  }

  async cleanupExpired(now: Date = new Date()): Promise<number> {
    const result = await query<IdentityRefreshTokens[]>(
      `DELETE FROM "public"."identityRefreshTokens"
       WHERE "expiresAt" < $1
       RETURNING "authRefreshTokenId"`,
      [now],
    );

    return result ? result.length : 0;
  }
}

export default AuthRefreshTokenRepo;
