import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface ShippingCarrier {
  shippingCarrierId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description?: string;
  websiteUrl?: string;
  trackingUrl?: string;
  isActive: boolean;
  accountNumber?: string;
  apiCredentials?: Record<string, any>;
  supportedRegions?: string[];
  supportedServices?: string[];
  requiresContract: boolean;
  hasApiIntegration: boolean;
  customFields?: Record<string, any>;
  createdBy?: string;
}

export type ShippingCarrierCreateParams = Omit<ShippingCarrier, 'shippingCarrierId' | 'createdAt' | 'updatedAt'>;
export type ShippingCarrierUpdateParams = Partial<Omit<ShippingCarrier, 'shippingCarrierId' | 'code' | 'createdAt' | 'updatedAt'>>;

export class ShippingCarrierRepo {
  async findById(id: string): Promise<ShippingCarrier | null> {
    return await queryOne<ShippingCarrier>(`SELECT * FROM "shippingCarrier" WHERE "shippingCarrierId" = $1`, [id]);
  }

  async findByCode(code: string): Promise<ShippingCarrier | null> {
    return await queryOne<ShippingCarrier>(`SELECT * FROM "shippingCarrier" WHERE "code" = $1`, [code]);
  }

  async findAll(activeOnly = false): Promise<ShippingCarrier[]> {
    let sql = `SELECT * FROM "shippingCarrier"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    sql += ` ORDER BY "name" ASC`;
    return (await query<ShippingCarrier[]>(sql)) || [];
  }

  async findWithApiIntegration(): Promise<ShippingCarrier[]> {
    return (await query<ShippingCarrier[]>(
      `SELECT * FROM "shippingCarrier" WHERE "hasApiIntegration" = true AND "isActive" = true ORDER BY "name" ASC`
    )) || [];
  }

  async findByRegion(region: string): Promise<ShippingCarrier[]> {
    return (await query<ShippingCarrier[]>(
      `SELECT * FROM "shippingCarrier" WHERE "supportedRegions" @> $1::jsonb AND "isActive" = true ORDER BY "name" ASC`,
      [JSON.stringify([region])]
    )) || [];
  }

  async search(searchTerm: string): Promise<ShippingCarrier[]> {
    return (await query<ShippingCarrier[]>(
      `SELECT * FROM "shippingCarrier" WHERE ("name" ILIKE $1 OR "code" ILIKE $1) AND "isActive" = true ORDER BY "name" ASC`,
      [`%${searchTerm}%`]
    )) || [];
  }

  async create(params: ShippingCarrierCreateParams): Promise<ShippingCarrier> {
    const now = unixTimestamp();

    const existing = await this.findByCode(params.code);
    if (existing) throw new Error(`Carrier with code '${params.code}' already exists`);

    const result = await queryOne<ShippingCarrier>(
      `INSERT INTO "shippingCarrier" (
        "name", "code", "description", "websiteUrl", "trackingUrl", "isActive", "accountNumber",
        "apiCredentials", "supportedRegions", "supportedServices", "requiresContract", "hasApiIntegration",
        "customFields", "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        params.name, params.code, params.description || null, params.websiteUrl || null,
        params.trackingUrl || null, params.isActive ?? true, params.accountNumber || null,
        params.apiCredentials ? JSON.stringify(params.apiCredentials) : null,
        params.supportedRegions || null, params.supportedServices || null,
        params.requiresContract || false, params.hasApiIntegration || false,
        params.customFields ? JSON.stringify(params.customFields) : null, params.createdBy || null,
        now, now
      ]
    );

    if (!result) throw new Error('Failed to create shipping carrier');
    return result;
  }

  async update(id: string, params: ShippingCarrierUpdateParams): Promise<ShippingCarrier | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['apiCredentials', 'customFields'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<ShippingCarrier>(
      `UPDATE "shippingCarrier" SET ${updateFields.join(', ')} WHERE "shippingCarrierId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async updateApiCredentials(id: string, apiCredentials: Record<string, any>): Promise<ShippingCarrier | null> {
    return this.update(id, { apiCredentials });
  }

  async activate(id: string): Promise<ShippingCarrier | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<ShippingCarrier | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ shippingCarrierId: string }>(
      `DELETE FROM "shippingCarrier" WHERE "shippingCarrierId" = $1 RETURNING "shippingCarrierId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "shippingCarrier"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<{ total: number; active: number; withApi: number; withContract: number }> {
    const total = await this.count();
    const active = await this.count(true);

    const apiResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "shippingCarrier" WHERE "hasApiIntegration" = true`
    );
    const withApi = apiResult ? parseInt(apiResult.count, 10) : 0;

    const contractResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "shippingCarrier" WHERE "requiresContract" = true`
    );
    const withContract = contractResult ? parseInt(contractResult.count, 10) : 0;

    return { total, active, withApi, withContract };
  }
}

export default new ShippingCarrierRepo();
