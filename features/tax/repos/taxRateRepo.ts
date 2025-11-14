import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type TaxRateType = 'percentage' | 'fixed';

export interface TaxRate {
  taxRateId: string;
  createdAt: string;
  updatedAt: string;
  taxCategoryId: string;
  taxZoneId: string;
  name: string;
  rate: number;
  type: TaxRateType;
  priority: number;
  isCompound: boolean;
  includeInPrice: boolean;
  isShippingTaxable: boolean;
  fixedAmount?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  threshold?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export type TaxRateCreateParams = Omit<TaxRate, 'taxRateId' | 'createdAt' | 'updatedAt'>;
export type TaxRateUpdateParams = Partial<Omit<TaxRate, 'taxRateId' | 'createdAt' | 'updatedAt'>>;

export class TaxRateRepo {
  async findById(id: string): Promise<TaxRate | null> {
    return await queryOne<TaxRate>(`SELECT * FROM "taxRate" WHERE "taxRateId" = $1`, [id]);
  }

  async findByCategory(taxCategoryId: string, activeOnly = false): Promise<TaxRate[]> {
    let sql = `SELECT * FROM "taxRate" WHERE "taxCategoryId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true AND "startDate" <= $2 AND ("endDate" IS NULL OR "endDate" >= $2)`;
    sql += ` ORDER BY "priority" ASC`;
    const params = activeOnly ? [taxCategoryId, unixTimestamp()] : [taxCategoryId];
    return (await query<TaxRate[]>(sql, params)) || [];
  }

  async findByZone(taxZoneId: string, activeOnly = false): Promise<TaxRate[]> {
    let sql = `SELECT * FROM "taxRate" WHERE "taxZoneId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true AND "startDate" <= $2 AND ("endDate" IS NULL OR "endDate" >= $2)`;
    sql += ` ORDER BY "priority" ASC`;
    const params = activeOnly ? [taxZoneId, unixTimestamp()] : [taxZoneId];
    return (await query<TaxRate[]>(sql, params)) || [];
  }

  async findByCategoryAndZone(taxCategoryId: string, taxZoneId: string, activeOnly = false): Promise<TaxRate[]> {
    let sql = `SELECT * FROM "taxRate" WHERE "taxCategoryId" = $1 AND "taxZoneId" = $2`;
    if (activeOnly) sql += ` AND "isActive" = true AND "startDate" <= $3 AND ("endDate" IS NULL OR "endDate" >= $3)`;
    sql += ` ORDER BY "priority" ASC`;
    const params = activeOnly ? [taxCategoryId, taxZoneId, unixTimestamp()] : [taxCategoryId, taxZoneId];
    return (await query<TaxRate[]>(sql, params)) || [];
  }

  async create(params: TaxRateCreateParams): Promise<TaxRate> {
    const now = unixTimestamp();
    const result = await queryOne<TaxRate>(
      `INSERT INTO "taxRate" (
        "taxCategoryId", "taxZoneId", "name", "rate", "type", "priority", "isCompound",
        "includeInPrice", "isShippingTaxable", "fixedAmount", "minimumAmount", "maximumAmount",
        "threshold", "startDate", "endDate", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        params.taxCategoryId, params.taxZoneId, params.name, params.rate, params.type || 'percentage',
        params.priority || 0, params.isCompound || false, params.includeInPrice || false,
        params.isShippingTaxable || false, params.fixedAmount || null, params.minimumAmount || null,
        params.maximumAmount || null, params.threshold || null, params.startDate || now,
        params.endDate || null, params.isActive ?? true, now, now
      ]
    );
    if (!result) throw new Error('Failed to create tax rate');
    return result;
  }

  async update(id: string, params: TaxRateUpdateParams): Promise<TaxRate | null> {
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

    return await queryOne<TaxRate>(
      `UPDATE "taxRate" SET ${updateFields.join(', ')} WHERE "taxRateId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<TaxRate | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<TaxRate | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxRateId: string }>(
      `DELETE FROM "taxRate" WHERE "taxRateId" = $1 RETURNING "taxRateId"`,
      [id]
    );
    return !!result;
  }

  async count(filters?: { taxCategoryId?: string; taxZoneId?: string; activeOnly?: boolean }): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxRate" WHERE 1=1`;
    const params: any[] = [];

    if (filters?.taxCategoryId) {
      sql += ` AND "taxCategoryId" = $${params.length + 1}`;
      params.push(filters.taxCategoryId);
    }
    if (filters?.taxZoneId) {
      sql += ` AND "taxZoneId" = $${params.length + 1}`;
      params.push(filters.taxZoneId);
    }
    if (filters?.activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxRateRepo();
