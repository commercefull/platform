import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { IdentityMerchantSession } from '../../../libs/db/types';

export type MerchantSession = IdentityMerchantSession;

export interface MerchantSessionCreateParams {
  merchantId: string;
  ipAddress?: MerchantSession['ipAddress'];
  userAgent?: MerchantSession['userAgent'];
  deviceInfo?: MerchantSession['deviceInfo'];
  expiresAt?: MerchantSession['expiresAt'];
  lastActivityAt?: MerchantSession['lastActivityAt'];
  isActive?: MerchantSession['isActive'];
  sessionToken?: MerchantSession['sessionToken'];
}

export class MerchantSessionRepo {
  private generateSessionToken(): string {
    return generateUUID() + '-' + Date.now().toString(36);
  }

  async findById(id: string): Promise<MerchantSession | null> {
    return await queryOne<MerchantSession>(`SELECT * FROM "identityMerchantSession" WHERE "merchantSessionId" = $1`, [id]);
  }

  async findByToken(token: string): Promise<MerchantSession | null> {
    return await queryOne<MerchantSession>(
      `SELECT * FROM "identityMerchantSession" WHERE "sessionToken" = $1 AND "isActive" = true`,
      [token]
    );
  }

  async findByMerchantId(merchantId: string): Promise<MerchantSession[]> {
    return (
      (await query<MerchantSession[]>(
        `SELECT * FROM "identityMerchantSession" WHERE "merchantId" = $1 AND "isActive" = true ORDER BY "lastActivityAt" DESC`,
        [merchantId]
      )) || []
    );
  }

  async create(params: MerchantSessionCreateParams): Promise<MerchantSession> {
    const now = new Date();
    const sessionToken = params.sessionToken || this.generateSessionToken();
    const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiresAt = params.expiresAt ?? defaultExpiry;
    const lastActivityAt = params.lastActivityAt ?? now;
    const isActive = params.isActive ?? true;

    const result = await queryOne<MerchantSession>(
      `INSERT INTO "identityMerchantSession" (
        "merchantId", "sessionToken", "ipAddress", "userAgent", "deviceInfo", "expiresAt",
        "lastActivityAt", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        params.merchantId,
        sessionToken,
        params.ipAddress ?? null,
        params.userAgent ?? null,
        params.deviceInfo ?? null,
        expiresAt,
        lastActivityAt,
        isActive,
        now,
        now
      ]
    );

    if (!result) throw new Error('Failed to create merchant session');
    return result;
  }

  async updateActivity(token: string): Promise<MerchantSession | null> {
    const now = new Date();
    return await queryOne<MerchantSession>(
      `UPDATE "identityMerchantSession" SET "lastActivityAt" = $1, "updatedAt" = $1 WHERE "sessionToken" = $2 RETURNING *`,
      [now, token]
    );
  }

  async updateExpiry(token: string, expiresAt: Date): Promise<MerchantSession | null> {
    return await queryOne<MerchantSession>(
      `UPDATE "identityMerchantSession" SET "expiresAt" = $1, "updatedAt" = $2 WHERE "sessionToken" = $3 RETURNING *`,
      [expiresAt, new Date(), token]
    );
  }

  async invalidate(token: string): Promise<boolean> {
    const result = await queryOne<{ merchantSessionId: string }>(
      `UPDATE "identityMerchantSession" SET "isActive" = false, "updatedAt" = $1 WHERE "sessionToken" = $2 RETURNING "merchantSessionId"`,
      [new Date(), token]
    );
    return !!result;
  }

  async invalidateAllForMerchant(merchantId: string): Promise<number> {
    const results = await query<{ merchantSessionId: string }[]>(
      `UPDATE "identityMerchantSession" SET "isActive" = false, "updatedAt" = $1 WHERE "merchantId" = $2 RETURNING "merchantSessionId"`,
      [new Date(), merchantId]
    );
    return results ? results.length : 0;
  }

  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const results = await query<{ merchantSessionId: string }[]>(
      `DELETE FROM "identityMerchantSession" WHERE "expiresAt" < $1 RETURNING "merchantSessionId"`,
      [now]
    );
    return results ? results.length : 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ merchantSessionId: string }>(
      `DELETE FROM "identityMerchantSession" WHERE "merchantSessionId" = $1 RETURNING "merchantSessionId"`,
      [id]
    );
    return !!result;
  }
}

export default new MerchantSessionRepo();
