import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type ShippingMethodType = 'domestic' | 'international' | 'both';

export interface ShippingMethod {
  shippingMethodId: string;
  createdAt: string;
  updatedAt: string;
  carrierId?: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  serviceCode?: string;
  domesticInternational: ShippingMethodType;
  estimatedDeliveryDays?: any;
  handlingDays?: number;
  priority?: number;
  displayOnFrontend: boolean;
  allowFreeShipping: boolean;
  minWeight?: number;
  maxWeight?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  dimensionRestrictions?: any;
  shippingClass?: string;
  customFields?: any;
  createdBy?: string;
}

export type ShippingMethodCreateParams = Omit<ShippingMethod, 'shippingMethodId' | 'createdAt' | 'updatedAt'>;
export type ShippingMethodUpdateParams = Partial<Omit<ShippingMethod, 'shippingMethodId' | 'createdAt' | 'updatedAt'>>;

export class ShippingMethodRepo {
  async findById(id: string): Promise<ShippingMethod | null> {
    return await queryOne<ShippingMethod>(`SELECT * FROM "shippingMethod" WHERE "shippingMethodId" = $1`, [id]);
  }

  async findByCode(code: string): Promise<ShippingMethod | null> {
    return await queryOne<ShippingMethod>(`SELECT * FROM "shippingMethod" WHERE "code" = $1`, [code]);
  }

  async findByCarrier(carrierId: string, activeOnly = false): Promise<ShippingMethod[]> {
    let sql = `SELECT * FROM "shippingMethod" WHERE "carrierId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" ASC`;
    return (await query<ShippingMethod[]>(sql, [carrierId])) || [];
  }

  async findAll(activeOnly = false, displayOnFrontend = false): Promise<ShippingMethod[]> {
    let sql = `SELECT * FROM "shippingMethod" WHERE 1=1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    if (displayOnFrontend) sql += ` AND "displayOnFrontend" = true`;
    sql += ` ORDER BY "priority" ASC, "name" ASC`;
    return (await query<ShippingMethod[]>(sql)) || [];
  }

  async findDefault(): Promise<ShippingMethod | null> {
    return await queryOne<ShippingMethod>(
      `SELECT * FROM "shippingMethod" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
    );
  }

  async create(params: ShippingMethodCreateParams): Promise<ShippingMethod> {
    const now = unixTimestamp();

    if (params.isDefault) {
      await query(`UPDATE "shippingMethod" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true`, [now]);
    }

    const result = await queryOne<ShippingMethod>(
      `INSERT INTO "shippingMethod" (
        "carrierId", "name", "code", "description", "isActive", "isDefault", "serviceCode",
        "domesticInternational", "estimatedDeliveryDays", "handlingDays", "priority",
        "displayOnFrontend", "allowFreeShipping", "minWeight", "maxWeight", "minOrderValue",
        "maxOrderValue", "dimensionRestrictions", "shippingClass", "customFields", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *`,
      [
        params.carrierId || null, params.name, params.code, params.description || null,
        params.isActive ?? true, params.isDefault || false, params.serviceCode || null,
        params.domesticInternational || 'both', JSON.stringify(params.estimatedDeliveryDays || {}),
        params.handlingDays || 1, params.priority || 0, params.displayOnFrontend ?? true,
        params.allowFreeShipping ?? true, params.minWeight || null, params.maxWeight || null,
        params.minOrderValue || null, params.maxOrderValue || null,
        JSON.stringify(params.dimensionRestrictions || {}), params.shippingClass || null,
        JSON.stringify(params.customFields || {}), params.createdBy || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create shipping method');
    return result;
  }

  async update(id: string, params: ShippingMethodUpdateParams): Promise<ShippingMethod | null> {
    if (params.isDefault === true) {
      await query(
        `UPDATE "shippingMethod" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true AND "shippingMethodId" != $2`,
        [unixTimestamp(), id]
      );
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (['estimatedDeliveryDays', 'dimensionRestrictions', 'customFields'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<ShippingMethod>(
      `UPDATE "shippingMethod" SET ${updateFields.join(', ')} WHERE "shippingMethodId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<ShippingMethod | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<ShippingMethod | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ shippingMethodId: string }>(
      `DELETE FROM "shippingMethod" WHERE "shippingMethodId" = $1 RETURNING "shippingMethodId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "shippingMethod"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new ShippingMethodRepo();
