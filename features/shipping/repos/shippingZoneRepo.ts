import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type ShippingZoneLocationType = 'country' | 'state' | 'zipcode' | 'region' | 'continent';

export interface ShippingZone {
  shippingZoneId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority?: number;
  locationType: ShippingZoneLocationType;
  locations: any;
  excludedLocations?: any;
  createdBy?: string;
}

export type ShippingZoneCreateParams = Omit<ShippingZone, 'shippingZoneId' | 'createdAt' | 'updatedAt'>;
export type ShippingZoneUpdateParams = Partial<Omit<ShippingZone, 'shippingZoneId' | 'createdAt' | 'updatedAt'>>;

export class ShippingZoneRepo {
  async findById(id: string): Promise<ShippingZone | null> {
    return await queryOne<ShippingZone>(`SELECT * FROM "shippingZone" WHERE "shippingZoneId" = $1`, [id]);
  }

  async findByName(name: string): Promise<ShippingZone | null> {
    return await queryOne<ShippingZone>(`SELECT * FROM "shippingZone" WHERE "name" = $1`, [name]);
  }

  async findAll(activeOnly = false): Promise<ShippingZone[]> {
    let sql = `SELECT * FROM "shippingZone"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    sql += ` ORDER BY "priority" ASC, "name" ASC`;
    return (await query<ShippingZone[]>(sql)) || [];
  }

  async findByLocationType(locationType: ShippingZoneLocationType, activeOnly = false): Promise<ShippingZone[]> {
    let sql = `SELECT * FROM "shippingZone" WHERE "locationType" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" ASC`;
    return (await query<ShippingZone[]>(sql, [locationType])) || [];
  }

  async create(params: ShippingZoneCreateParams): Promise<ShippingZone> {
    const now = unixTimestamp();
    const result = await queryOne<ShippingZone>(
      `INSERT INTO "shippingZone" (
        "name", "description", "isActive", "priority", "locationType", "locations",
        "excludedLocations", "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        params.name, params.description || null, params.isActive ?? true, params.priority || 0,
        params.locationType || 'country', JSON.stringify(params.locations),
        JSON.stringify(params.excludedLocations || []), params.createdBy || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create shipping zone');
    return result;
  }

  async update(id: string, params: ShippingZoneUpdateParams): Promise<ShippingZone | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (['locations', 'excludedLocations'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<ShippingZone>(
      `UPDATE "shippingZone" SET ${updateFields.join(', ')} WHERE "shippingZoneId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<ShippingZone | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<ShippingZone | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ shippingZoneId: string }>(
      `DELETE FROM "shippingZone" WHERE "shippingZoneId" = $1 RETURNING "shippingZoneId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "shippingZone"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new ShippingZoneRepo();
