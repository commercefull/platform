import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface PriceList {
  priceListId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  priority?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export type PriceListCreateParams = Omit<PriceList, 'priceListId' | 'createdAt' | 'updatedAt'>;
export type PriceListUpdateParams = Partial<Omit<PriceList, 'priceListId' | 'createdAt' | 'updatedAt'>>;

export class PriceListRepo {
  async findById(id: string): Promise<PriceList | null> {
    return await queryOne<PriceList>(`SELECT * FROM "priceList" WHERE "priceListId" = $1`, [id]);
  }

  async findByName(name: string): Promise<PriceList | null> {
    return await queryOne<PriceList>(`SELECT * FROM "priceList" WHERE "name" = $1`, [name]);
  }

  async findAll(activeOnly = false): Promise<PriceList[]> {
    let sql = `SELECT * FROM "priceList"`;
    if (activeOnly) {
      sql += ` WHERE "isActive" = true AND ("startDate" IS NULL OR "startDate" <= $1) AND ("endDate" IS NULL OR "endDate" >= $1)`;
      return (await query<PriceList[]>(sql, [unixTimestamp()])) || [];
    }
    sql += ` ORDER BY "priority" DESC, "name" ASC`;
    return (await query<PriceList[]>(sql)) || [];
  }

  async findActive(): Promise<PriceList[]> {
    return this.findAll(true);
  }

  async create(params: PriceListCreateParams): Promise<PriceList> {
    const now = unixTimestamp();
    const result = await queryOne<PriceList>(
      `INSERT INTO "priceList" (
        "name", "description", "priority", "isActive", "startDate", "endDate", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        params.name,
        params.description || null,
        params.priority || 0,
        params.isActive ?? true,
        params.startDate || null,
        params.endDate || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create price list');
    return result;
  }

  async update(id: string, params: PriceListUpdateParams): Promise<PriceList | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<PriceList>(
      `UPDATE "priceList" SET ${updateFields.join(', ')} WHERE "priceListId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async activate(id: string): Promise<PriceList | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<PriceList | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ priceListId: string }>(`DELETE FROM "priceList" WHERE "priceListId" = $1 RETURNING "priceListId"`, [
      id,
    ]);
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "priceList"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new PriceListRepo();
