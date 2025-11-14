import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type ShippingRateType = 'flat' | 'weightBased' | 'priceBased' | 'itemBased' | 'dimensional' | 'calculated' | 'free';

export interface ShippingRate {
  shippingRateId: string;
  createdAt: string;
  updatedAt: string;
  zoneId: string;
  methodId: string;
  name?: string;
  description?: string;
  isActive: boolean;
  rateType: ShippingRateType;
  baseRate: number;
  perItemRate?: number;
  freeThreshold?: number;
  rateMatrix?: any;
  minRate?: number;
  maxRate?: number;
  currency: string;
  taxable: boolean;
  priority?: number;
  validFrom?: string;
  validTo?: string;
  conditions?: any;
  createdBy?: string;
}

export type ShippingRateCreateParams = Omit<ShippingRate, 'shippingRateId' | 'createdAt' | 'updatedAt'>;
export type ShippingRateUpdateParams = Partial<Omit<ShippingRate, 'shippingRateId' | 'zoneId' | 'methodId' | 'createdAt' | 'updatedAt'>>;

export class ShippingRateRepo {
  async findById(id: string): Promise<ShippingRate | null> {
    return await queryOne<ShippingRate>(`SELECT * FROM "shippingRate" WHERE "shippingRateId" = $1`, [id]);
  }

  async findByZone(zoneId: string, activeOnly = false): Promise<ShippingRate[]> {
    let sql = `SELECT * FROM "shippingRate" WHERE "zoneId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true AND ("validFrom" IS NULL OR "validFrom" <= $2) AND ("validTo" IS NULL OR "validTo" >= $2)`;
    sql += ` ORDER BY "priority" ASC`;
    const params = activeOnly ? [zoneId, unixTimestamp()] : [zoneId];
    return (await query<ShippingRate[]>(sql, params)) || [];
  }

  async findByMethod(methodId: string, activeOnly = false): Promise<ShippingRate[]> {
    let sql = `SELECT * FROM "shippingRate" WHERE "methodId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true AND ("validFrom" IS NULL OR "validFrom" <= $2) AND ("validTo" IS NULL OR "validTo" >= $2)`;
    sql += ` ORDER BY "priority" ASC`;
    const params = activeOnly ? [methodId, unixTimestamp()] : [methodId];
    return (await query<ShippingRate[]>(sql, params)) || [];
  }

  async findByZoneAndMethod(zoneId: string, methodId: string): Promise<ShippingRate | null> {
    return await queryOne<ShippingRate>(
      `SELECT * FROM "shippingRate" WHERE "zoneId" = $1 AND "methodId" = $2 AND "isActive" = true ORDER BY "priority" ASC LIMIT 1`,
      [zoneId, methodId]
    );
  }

  async findActive(zoneId?: string, methodId?: string): Promise<ShippingRate[]> {
    let sql = `SELECT * FROM "shippingRate" WHERE "isActive" = true`;
    const params: any[] = [];
    const now = unixTimestamp();

    if (zoneId) {
      sql += ` AND "zoneId" = $${params.length + 1}`;
      params.push(zoneId);
    }
    if (methodId) {
      sql += ` AND "methodId" = $${params.length + 1}`;
      params.push(methodId);
    }

    sql += ` AND ("validFrom" IS NULL OR "validFrom" <= $${params.length + 1}) AND ("validTo" IS NULL OR "validTo" >= $${params.length + 1})`;
    params.push(now);
    sql += ` ORDER BY "priority" ASC`;

    return (await query<ShippingRate[]>(sql, params)) || [];
  }

  async create(params: ShippingRateCreateParams): Promise<ShippingRate> {
    const now = unixTimestamp();
    const result = await queryOne<ShippingRate>(
      `INSERT INTO "shippingRate" (
        "zoneId", "methodId", "name", "description", "isActive", "rateType", "baseRate",
        "perItemRate", "freeThreshold", "rateMatrix", "minRate", "maxRate", "currency",
        "taxable", "priority", "validFrom", "validTo", "conditions", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
      [
        params.zoneId, params.methodId, params.name || null, params.description || null,
        params.isActive ?? true, params.rateType, params.baseRate, params.perItemRate || 0,
        params.freeThreshold || null, JSON.stringify(params.rateMatrix || {}), params.minRate || null,
        params.maxRate || null, params.currency || 'USD', params.taxable ?? true, params.priority || 0,
        params.validFrom || null, params.validTo || null, JSON.stringify(params.conditions || {}),
        params.createdBy || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create shipping rate');
    return result;
  }

  async update(id: string, params: ShippingRateUpdateParams): Promise<ShippingRate | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (['rateMatrix', 'conditions'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<ShippingRate>(
      `UPDATE "shippingRate" SET ${updateFields.join(', ')} WHERE "shippingRateId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<ShippingRate | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<ShippingRate | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ shippingRateId: string }>(
      `DELETE FROM "shippingRate" WHERE "shippingRateId" = $1 RETURNING "shippingRateId"`,
      [id]
    );
    return !!result;
  }

  async count(zoneId?: string, methodId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "shippingRate" WHERE 1=1`;
    const params: any[] = [];

    if (zoneId) {
      sql += ` AND "zoneId" = $${params.length + 1}`;
      params.push(zoneId);
    }
    if (methodId) {
      sql += ` AND "methodId" = $${params.length + 1}`;
      params.push(methodId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new ShippingRateRepo();
