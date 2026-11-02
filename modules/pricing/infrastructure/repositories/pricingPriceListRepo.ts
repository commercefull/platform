import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreatePricingError } from '../../domain/errors/PricingErrors';
import type { PricingPriceList as DbPricingPriceList } from '../../../../libs/db/types';

export interface PriceList {
  priceListId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description?: string;
  priority?: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

function rowToPriceList(row: DbPricingPriceList): PriceList {
  return {
    priceListId: row.priceListId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    name: row.name,
    description: row.description ?? undefined,
    priority: row.priority ?? undefined,
    isActive: row.isActive,
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
  };
}

export type PriceListCreateParams = Omit<PriceList, 'priceListId' | 'createdAt' | 'updatedAt'>;
export type PriceListUpdateParams = Partial<Omit<PriceList, 'priceListId' | 'createdAt' | 'updatedAt'>>;

class PriceListRepo {
  async findById(id: string): Promise<PriceList | null> {
    const row = await queryOne<DbPricingPriceList>(`SELECT * FROM "pricingPriceList" WHERE "priceListId" = $1`, [id]);
    return row ? rowToPriceList(row) : null;
  }

  async findByName(name: string): Promise<PriceList | null> {
    const row = await queryOne<DbPricingPriceList>(`SELECT * FROM "pricingPriceList" WHERE "name" = $1`, [name]);
    return row ? rowToPriceList(row) : null;
  }

  async findAll(activeOnly = false): Promise<PriceList[]> {
    let sql = `SELECT * FROM "pricingPriceList"`;
    if (activeOnly) {
      sql += ` WHERE "isActive" = true AND ("startDate" IS NULL OR "startDate" <= $1) AND ("endDate" IS NULL OR "endDate" >= $1)`;
      const rows = await query<DbPricingPriceList[]>(sql, [unixTimestamp()]);
      return (rows || []).map(rowToPriceList);
    }
    sql += ` ORDER BY "priority" DESC, "name" ASC`;
    const rows = await query<DbPricingPriceList[]>(sql);
    return (rows || []).map(rowToPriceList);
  }

  async findActive(): Promise<PriceList[]> {
    return this.findAll(true);
  }

  async create(params: PriceListCreateParams): Promise<PriceList> {
    const now = unixTimestamp();
    const result = await queryOne<DbPricingPriceList>(
      `INSERT INTO "pricingPriceList" (
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
    if (!result) throw new FailedToCreatePricingError('Failed to create price list');
    return rowToPriceList(result);
  }

  async update(id: string, params: PriceListUpdateParams): Promise<PriceList | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
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

    const row = await queryOne<DbPricingPriceList>(
      `UPDATE "pricingPriceList" SET ${updateFields.join(', ')} WHERE "priceListId" = $${paramIndex} RETURNING *`,
      values,
    );
    return row ? rowToPriceList(row) : null;
  }

  async activate(id: string): Promise<PriceList | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<PriceList | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ priceListId: string }>(
      `DELETE FROM "pricingPriceList" WHERE "priceListId" = $1 RETURNING "priceListId"`,
      [id],
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "pricingPriceList"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new PriceListRepo();
