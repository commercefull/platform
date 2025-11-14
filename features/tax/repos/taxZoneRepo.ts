import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface TaxZone {
  taxZoneId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  countries: any; // JSON array
  states?: any; // JSON array
  postcodes?: any; // JSON array
  cities?: any; // JSON array
  isActive: boolean;
}

export type TaxZoneCreateParams = Omit<TaxZone, 'taxZoneId' | 'createdAt' | 'updatedAt'>;
export type TaxZoneUpdateParams = Partial<Omit<TaxZone, 'taxZoneId' | 'createdAt' | 'updatedAt'>>;

export class TaxZoneRepo {
  async findById(id: string): Promise<TaxZone | null> {
    return await queryOne<TaxZone>(`SELECT * FROM "taxZone" WHERE "taxZoneId" = $1`, [id]);
  }

  async findByCode(code: string): Promise<TaxZone | null> {
    return await queryOne<TaxZone>(`SELECT * FROM "taxZone" WHERE "code" = $1`, [code]);
  }

  async findDefault(): Promise<TaxZone | null> {
    return await queryOne<TaxZone>(
      `SELECT * FROM "taxZone" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
    );
  }

  async findAll(activeOnly = false): Promise<TaxZone[]> {
    let sql = `SELECT * FROM "taxZone"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    sql += ` ORDER BY "isDefault" DESC, "name" ASC`;
    return (await query<TaxZone[]>(sql)) || [];
  }

  async create(params: TaxZoneCreateParams): Promise<TaxZone> {
    const now = unixTimestamp();

    if (params.isDefault) {
      await query(`UPDATE "taxZone" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true`, [now]);
    }

    const result = await queryOne<TaxZone>(
      `INSERT INTO "taxZone" (
        "name", "code", "description", "isDefault", "countries", "states", 
        "postcodes", "cities", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        params.name, params.code, params.description || null, params.isDefault || false,
        JSON.stringify(params.countries), JSON.stringify(params.states || []),
        JSON.stringify(params.postcodes || []), JSON.stringify(params.cities || []),
        params.isActive ?? true, now, now
      ]
    );
    if (!result) throw new Error('Failed to create tax zone');
    return result;
  }

  async update(id: string, params: TaxZoneUpdateParams): Promise<TaxZone | null> {
    if (params.isDefault === true) {
      await query(
        `UPDATE "taxZone" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true AND "taxZoneId" != $2`,
        [unixTimestamp(), id]
      );
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (['countries', 'states', 'postcodes', 'cities'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<TaxZone>(
      `UPDATE "taxZone" SET ${updateFields.join(', ')} WHERE "taxZoneId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<TaxZone | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<TaxZone | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxZoneId: string }>(
      `DELETE FROM "taxZone" WHERE "taxZoneId" = $1 RETURNING "taxZoneId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxZone"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxZoneRepo();
