import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type RuleAdjustmentType = 'percentage' | 'fixed';

export interface RuleAdjustment {
  ruleAdjustmentId: string;
  pricingRuleId: string;
  type: RuleAdjustmentType;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export type RuleAdjustmentCreateParams = Omit<RuleAdjustment, 'ruleAdjustmentId' | 'createdAt' | 'updatedAt'>;
export type RuleAdjustmentUpdateParams = Partial<Omit<RuleAdjustment, 'ruleAdjustmentId' | 'pricingRuleId' | 'createdAt' | 'updatedAt'>>;

export class RuleAdjustmentRepo {
  async findById(id: string): Promise<RuleAdjustment | null> {
    return await queryOne<RuleAdjustment>(`SELECT * FROM "ruleAdjustment" WHERE "ruleAdjustmentId" = $1`, [id]);
  }

  async findByPricingRule(pricingRuleId: string): Promise<RuleAdjustment[]> {
    return (await query<RuleAdjustment[]>(
      `SELECT * FROM "ruleAdjustment" WHERE "pricingRuleId" = $1 ORDER BY "createdAt" ASC`,
      [pricingRuleId]
    )) || [];
  }

  async findByType(type: RuleAdjustmentType): Promise<RuleAdjustment[]> {
    return (await query<RuleAdjustment[]>(
      `SELECT * FROM "ruleAdjustment" WHERE "type" = $1 ORDER BY "value" DESC`,
      [type]
    )) || [];
  }

  async create(params: RuleAdjustmentCreateParams): Promise<RuleAdjustment> {
    const now = unixTimestamp();
    const result = await queryOne<RuleAdjustment>(
      `INSERT INTO "ruleAdjustment" ("pricingRuleId", "type", "value", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.pricingRuleId, params.type, params.value, now, now]
    );
    if (!result) throw new Error('Failed to create rule adjustment');
    return result;
  }

  async update(id: string, params: RuleAdjustmentUpdateParams): Promise<RuleAdjustment | null> {
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

    return await queryOne<RuleAdjustment>(
      `UPDATE "ruleAdjustment" SET ${updateFields.join(', ')} WHERE "ruleAdjustmentId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ ruleAdjustmentId: string }>(
      `DELETE FROM "ruleAdjustment" WHERE "ruleAdjustmentId" = $1 RETURNING "ruleAdjustmentId"`,
      [id]
    );
    return !!result;
  }

  async deleteByPricingRule(pricingRuleId: string): Promise<number> {
    const results = await query<{ ruleAdjustmentId: string }[]>(
      `DELETE FROM "ruleAdjustment" WHERE "pricingRuleId" = $1 RETURNING "ruleAdjustmentId"`,
      [pricingRuleId]
    );
    return results ? results.length : 0;
  }

  async count(pricingRuleId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "ruleAdjustment"`;
    const params: any[] = [];
    if (pricingRuleId) {
      sql += ` WHERE "pricingRuleId" = $1`;
      params.push(pricingRuleId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new RuleAdjustmentRepo();
