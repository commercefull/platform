import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { IdentityCustomerSession } from '../../../libs/db/types';

export type CustomerSession = IdentityCustomerSession;

export interface CustomerSessionCreateParams {
  customerId: string;
  deviceInfo?: CustomerSession['deviceInfo'];
  ipAddress?: CustomerSession['ipAddress'];
  userAgent?: CustomerSession['userAgent'];
  isActive?: CustomerSession['isActive'];
  expiresAt?: CustomerSession['expiresAt'];
}

export class CustomerSessionRepo {
  private generateSessionToken(): string {
    return generateUUID() + '-' + Date.now().toString(36);
  }

  async findById(id: string): Promise<CustomerSession | null> {
    return await queryOne<CustomerSession>(`SELECT * FROM "identityCustomerSession" WHERE "customerSessionId" = $1`, [id]);
  }

  async findByToken(token: string): Promise<CustomerSession | null> {
    return await queryOne<CustomerSession>(`SELECT * FROM "identityCustomerSession" WHERE "token" = $1 AND "isActive" = true`, [token]);
  }

  async findByCustomerId(customerId: string): Promise<CustomerSession[]> {
    return (await query<CustomerSession[]>(
      `SELECT * FROM "identityCustomerSession" WHERE "customerId" = $1 AND "isActive" = true ORDER BY "createdAt" DESC`,
      [customerId]
    )) || [];
  }

  async create(params: CustomerSessionCreateParams): Promise<CustomerSession> {
    const now = new Date();
    const token = this.generateSessionToken();
    const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiresAt = params.expiresAt ?? defaultExpiry;

    const result = await queryOne<CustomerSession>(
      `INSERT INTO "identityCustomerSession" (
        "customerId", "token", "deviceInfo", "ipAddress", "userAgent", "isActive", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8) RETURNING *`,
      [
        params.customerId,
        token,
        params.deviceInfo ?? null,
        params.ipAddress ?? null,
        params.userAgent ?? null,
        expiresAt,
        now,
        now
      ]
    );

    if (!result) throw new Error('Failed to create session');
    return result;
  }

  async updateActivity(token: string): Promise<CustomerSession | null> {
    const timestamp = new Date();
    return await queryOne<CustomerSession>(
      `UPDATE "identityCustomerSession" SET "updatedAt" = $1 WHERE "token" = $2 RETURNING *`,
      [timestamp, token]
    );
  }

  async invalidate(token: string): Promise<boolean> {
    const timestamp = new Date();
    const result = await queryOne<{ customerSessionId: string }>(
      `UPDATE "identityCustomerSession" SET "isActive" = false, "updatedAt" = $1 WHERE "token" = $2 RETURNING "customerSessionId"`,
      [timestamp, token]
    );
    return !!result;
  }

  async invalidateAllForCustomer(customerId: string): Promise<number> {
    const timestamp = new Date();
    const results = await query<{ customerSessionId: string }[]>(
      `UPDATE "identityCustomerSession" SET "isActive" = false, "updatedAt" = $1 WHERE "customerId" = $2 RETURNING "customerSessionId"`,
      [timestamp, customerId]
    );
    return results ? results.length : 0;
  }

  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const results = await query<{ customerSessionId: string }[]>(
      `DELETE FROM "identityCustomerSession" WHERE "expiresAt" < $1 RETURNING "customerSessionId"`,
      [now]
    );
    return results ? results.length : 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerSessionId: string }>(
      `DELETE FROM "identityCustomerSession" WHERE "customerSessionId" = $1 RETURNING "customerSessionId"`,
      [id]
    );
    return !!result;
  }
}

export default new CustomerSessionRepo();
