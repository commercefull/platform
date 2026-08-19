import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { IdentityOrganizationSession } from '../../../../libs/db/types';

export type OrganizationSession = IdentityOrganizationSession;

export interface OrganizationSessionCreateParams {
  organizationId: string;
  ipAddress?: OrganizationSession['ipAddress'];
  userAgent?: OrganizationSession['userAgent'];
  deviceInfo?: OrganizationSession['deviceInfo'];
  expiresAt?: OrganizationSession['expiresAt'];
  lastActivityAt?: OrganizationSession['lastActivityAt'];
  isActive?: OrganizationSession['isActive'];
  sessionToken?: OrganizationSession['sessionToken'];
}

export class OrganizationSessionRepo {
  private generateSessionToken(): string {
    return generateUUID() + '-' + Date.now().toString(36);
  }

  async findById(id: string): Promise<OrganizationSession | null> {
    return await queryOne<OrganizationSession>(`SELECT * FROM "identityOrganizationSession" WHERE "organizationSessionId" = $1`, [id]);
  }

  async findByToken(token: string): Promise<OrganizationSession | null> {
    return await queryOne<OrganizationSession>(`SELECT * FROM "identityOrganizationSession" WHERE "sessionToken" = $1 AND "isActive" = true`, [
      token,
    ]);
  }

  async findByMerchantId(organizationId: string): Promise<OrganizationSession[]> {
    return (
      (await query<OrganizationSession[]>(
        `SELECT * FROM "identityOrganizationSession" WHERE "organizationId" = $1 AND "isActive" = true ORDER BY "lastActivityAt" DESC`,
        [organizationId],
      )) || []
    );
  }

  async create(params: OrganizationSessionCreateParams): Promise<OrganizationSession> {
    const now = new Date();
    const sessionToken = params.sessionToken || this.generateSessionToken();
    const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiresAt = params.expiresAt ?? defaultExpiry;
    const lastActivityAt = params.lastActivityAt ?? now;
    const isActive = params.isActive ?? true;

    const result = await queryOne<OrganizationSession>(
      `INSERT INTO "identityOrganizationSession" (
        "organizationId", "sessionToken", "ipAddress", "userAgent", "deviceInfo", "expiresAt",
        "lastActivityAt", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        params.organizationId,
        sessionToken,
        params.ipAddress ?? null,
        params.userAgent ?? null,
        params.deviceInfo ?? null,
        expiresAt,
        lastActivityAt,
        isActive,
        now,
        now,
      ],
    );

    if (!result) throw new Error('Failed to create merchant session');
    return result;
  }

  async updateActivity(token: string): Promise<OrganizationSession | null> {
    const now = new Date();
    return await queryOne<OrganizationSession>(
      `UPDATE "identityOrganizationSession" SET "lastActivityAt" = $1, "updatedAt" = $1 WHERE "sessionToken" = $2 RETURNING *`,
      [now, token],
    );
  }

  async updateExpiry(token: string, expiresAt: Date): Promise<OrganizationSession | null> {
    return await queryOne<OrganizationSession>(
      `UPDATE "identityOrganizationSession" SET "expiresAt" = $1, "updatedAt" = $2 WHERE "sessionToken" = $3 RETURNING *`,
      [expiresAt, new Date(), token],
    );
  }

  async invalidate(token: string): Promise<boolean> {
    const result = await queryOne<{ organizationSessionId: string }>(
      `UPDATE "identityOrganizationSession" SET "isActive" = false, "updatedAt" = $1 WHERE "sessionToken" = $2 RETURNING "organizationSessionId"`,
      [new Date(), token],
    );
    return !!result;
  }

  async invalidateAllForMerchant(organizationId: string): Promise<number> {
    const results = await query<{ organizationSessionId: string }[]>(
      `UPDATE "identityOrganizationSession" SET "isActive" = false, "updatedAt" = $1 WHERE "organizationId" = $2 RETURNING "organizationSessionId"`,
      [new Date(), organizationId],
    );
    return results ? results.length : 0;
  }

  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const results = await query<{ organizationSessionId: string }[]>(
      `DELETE FROM "identityOrganizationSession" WHERE "expiresAt" < $1 RETURNING "organizationSessionId"`,
      [now],
    );
    return results ? results.length : 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ organizationSessionId: string }>(
      `DELETE FROM "identityOrganizationSession" WHERE "organizationSessionId" = $1 RETURNING "organizationSessionId"`,
      [id],
    );
    return !!result;
  }
}

export default new OrganizationSessionRepo();
