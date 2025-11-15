import { query, queryOne } from '../../../libs/db';
import { IdentityTokenBlacklist } from '../../../libs/db/types';

export interface AuthTokenBlacklistCreateParams {
  token: string;
  userId: string;
  userType: string;
  reason?: IdentityTokenBlacklist['reason'];
  expiresAt?: IdentityTokenBlacklist['expiresAt'];
}

export class AuthTokenBlacklistRepo {
  async create(params: AuthTokenBlacklistCreateParams): Promise<IdentityTokenBlacklist> {
    const now = new Date();
    const expiresAt = params.expiresAt || new Date(Date.now() + 86400000); // 24 hours default

    const record = await queryOne<IdentityTokenBlacklist>(
      `INSERT INTO "public"."identityTokenBlacklist" (
        "token", "userType", "userId", "expiresAt", "invalidatedAt", "reason", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        params.token,
        params.userType,
        params.userId,
        expiresAt,
        now,
        params.reason ?? 'logout',
        now,
        now
      ]
    );

    if (!record) {
      throw new Error('Failed to create blacklist entry');
    }

    return record;
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await queryOne<IdentityTokenBlacklist>(
      `SELECT * FROM "public"."identityTokenBlacklist"
       WHERE "token" = $1 AND "expiresAt" > $2`,
      [token, new Date()]
    );

    return !!result;
  }

  async findByToken(token: string): Promise<IdentityTokenBlacklist | null> {
    return queryOne<IdentityTokenBlacklist>(
      `SELECT * FROM "public"."identityTokenBlacklist"
       WHERE "token" = $1`,
      [token]
    );
  }

  async findForUser(userId: string, userType: string): Promise<IdentityTokenBlacklist[]> {
    return (await query<IdentityTokenBlacklist[]>(
      `SELECT * FROM "public"."identityTokenBlacklist"
       WHERE "userId" = $1 AND "userType" = $2
       ORDER BY "invalidatedAt" DESC`,
      [userId, userType]
    )) || [];
  }

  async cleanupExpired(now: Date = new Date()): Promise<number> {
    const result = await query<IdentityTokenBlacklist[]>(
      `DELETE FROM "public"."identityTokenBlacklist"
       WHERE "expiresAt" < $1
       RETURNING "identityTokenBlacklistId"`,
      [now]
    );

    return result ? result.length : 0;
  }
}

export default AuthTokenBlacklistRepo;
