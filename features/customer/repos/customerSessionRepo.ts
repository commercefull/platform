import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';
import { generateUUID } from '../../../libs/uuid';

export interface CustomerSession {
  customerSessionId: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  sessionToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  expiresAt: string;
  lastActivityAt: string;
}

export type CustomerSessionCreateParams = Omit<CustomerSession, 'customerSessionId' | 'createdAt' | 'updatedAt' | 'sessionToken' | 'lastActivityAt'>;

export class CustomerSessionRepo {
  private generateSessionToken(): string {
    return generateUUID() + '-' + Date.now().toString(36);
  }

  async findById(id: string): Promise<CustomerSession | null> {
    return await queryOne<CustomerSession>(`SELECT * FROM "customerSession" WHERE "customerSessionId" = $1`, [id]);
  }

  async findByToken(token: string): Promise<CustomerSession | null> {
    return await queryOne<CustomerSession>(`SELECT * FROM "customerSession" WHERE "sessionToken" = $1 AND "isActive" = true`, [token]);
  }

  async findByCustomerId(customerId: string): Promise<CustomerSession[]> {
    return (await query<CustomerSession[]>(
      `SELECT * FROM "customerSession" WHERE "customerId" = $1 AND "isActive" = true ORDER BY "lastActivityAt" DESC`,
      [customerId]
    )) || [];
  }

  async create(params: CustomerSessionCreateParams): Promise<CustomerSession> {
    const now = unixTimestamp();
    const sessionToken = this.generateSessionToken();
    const defaultExpiry = parseInt(now) + (30 * 24 * 60 * 60); // 30 days

    const result = await queryOne<CustomerSession>(
      `INSERT INTO "customerSession" (
        "customerId", "sessionToken", "deviceInfo", "ipAddress", "userAgent", "isActive", "expiresAt", "lastActivityAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9) RETURNING *`,
      [params.customerId, sessionToken, params.deviceInfo || null, params.ipAddress || null, params.userAgent || null, params.expiresAt || defaultExpiry.toString(), now, now, now]
    );

    if (!result) throw new Error('Failed to create session');
    return result;
  }

  async updateActivity(token: string): Promise<CustomerSession | null> {
    return await queryOne<CustomerSession>(
      `UPDATE "customerSession" SET "lastActivityAt" = $1, "updatedAt" = $1 WHERE "sessionToken" = $2 RETURNING *`,
      [unixTimestamp(), token]
    );
  }

  async invalidate(token: string): Promise<boolean> {
    const result = await queryOne<{ customerSessionId: string }>(
      `UPDATE "customerSession" SET "isActive" = false, "updatedAt" = $1 WHERE "sessionToken" = $2 RETURNING "customerSessionId"`,
      [unixTimestamp(), token]
    );
    return !!result;
  }

  async invalidateAllForCustomer(customerId: string): Promise<number> {
    const results = await query<{ customerSessionId: string }[]>(
      `UPDATE "customerSession" SET "isActive" = false, "updatedAt" = $1 WHERE "customerId" = $2 RETURNING "customerSessionId"`,
      [unixTimestamp(), customerId]
    );
    return results ? results.length : 0;
  }

  async cleanupExpired(): Promise<number> {
    const now = unixTimestamp();
    const results = await query<{ customerSessionId: string }[]>(
      `DELETE FROM "customerSession" WHERE "expiresAt" < $1 RETURNING "customerSessionId"`,
      [now]
    );
    return results ? results.length : 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerSessionId: string }>(
      `DELETE FROM "customerSession" WHERE "customerSessionId" = $1 RETURNING "customerSessionId"`,
      [id]
    );
    return !!result;
  }
}

export default new CustomerSessionRepo();
