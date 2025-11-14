import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type TaxRuleConditionType = 'product' | 'category' | 'brand';

export interface TaxRule {
  taxRuleId: string;
  createdAt: string;
  updatedAt: string;
  taxRateId: string;
  name?: string;
  description?: string;
  conditionType: TaxRuleConditionType;
  conditionValue: any; // JSON
  sortOrder: number;
  isActive: boolean;
}

export type TaxRuleCreateParams = Omit<TaxRule, 'taxRuleId' | 'createdAt' | 'updatedAt'>;
export type TaxRuleUpdateParams = Partial<Omit<TaxRule, 'taxRuleId' | 'createdAt' | 'updatedAt'>>;

export class TaxRuleRepo {
  async findById(id: string): Promise<TaxRule | null> {
    return await queryOne<TaxRule>(`SELECT * FROM "taxRule" WHERE "taxRuleId" = $1`, [id]);
  }

  async findByTaxRate(taxRateId: string, activeOnly = false): Promise<TaxRule[]> {
    let sql = `SELECT * FROM "taxRule" WHERE "taxRateId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "sortOrder" ASC`;
    return (await query<TaxRule[]>(sql, [taxRateId])) || [];
  }

  async findByConditionType(conditionType: TaxRuleConditionType, activeOnly = false): Promise<TaxRule[]> {
    let sql = `SELECT * FROM "taxRule" WHERE "conditionType" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "sortOrder" ASC`;
    return (await query<TaxRule[]>(sql, [conditionType])) || [];
  }

  async create(params: TaxRuleCreateParams): Promise<TaxRule> {
    const now = unixTimestamp();
    const result = await queryOne<TaxRule>(
      `INSERT INTO "taxRule" (
        "taxRateId", "name", "description", "conditionType", "conditionValue", 
        "sortOrder", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        params.taxRateId, params.name || null, params.description || null, params.conditionType,
        JSON.stringify(params.conditionValue), params.sortOrder || 0, params.isActive ?? true, now, now
      ]
    );
    if (!result) throw new Error('Failed to create tax rule');
    return result;
  }

  async update(id: string, params: TaxRuleUpdateParams): Promise<TaxRule | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'conditionValue' ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<TaxRule>(
      `UPDATE "taxRule" SET ${updateFields.join(', ')} WHERE "taxRuleId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<TaxRule | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<TaxRule | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxRuleId: string }>(
      `DELETE FROM "taxRule" WHERE "taxRuleId" = $1 RETURNING "taxRuleId"`,
      [id]
    );
    return !!result;
  }

  async count(taxRateId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxRule"`;
    const params: any[] = [];

    if (taxRateId) {
      sql += ` WHERE "taxRateId" = $1`;
      params.push(taxRateId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxRuleRepo();
