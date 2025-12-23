import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface RuleCondition {
  ruleConditionId: string;
  createdAt: string;
  updatedAt: string;
  pricingRuleId: string;
  type: string;
  parameters: any;
}

export type RuleConditionCreateParams = Omit<RuleCondition, 'ruleConditionId' | 'createdAt' | 'updatedAt'>;
export type RuleConditionUpdateParams = Partial<Omit<RuleCondition, 'ruleConditionId' | 'pricingRuleId' | 'createdAt' | 'updatedAt'>>;

export class RuleConditionRepo {
  async findById(id: string): Promise<RuleCondition | null> {
    return await queryOne<RuleCondition>(`SELECT * FROM "ruleCondition" WHERE "ruleConditionId" = $1`, [id]);
  }

  async findByPricingRule(pricingRuleId: string): Promise<RuleCondition[]> {
    return (
      (await query<RuleCondition[]>(`SELECT * FROM "ruleCondition" WHERE "pricingRuleId" = $1 ORDER BY "createdAt" ASC`, [
        pricingRuleId,
      ])) || []
    );
  }

  async findByType(type: string): Promise<RuleCondition[]> {
    return (await query<RuleCondition[]>(`SELECT * FROM "ruleCondition" WHERE "type" = $1 ORDER BY "createdAt" DESC`, [type])) || [];
  }

  async create(params: RuleConditionCreateParams): Promise<RuleCondition> {
    const now = unixTimestamp();
    const result = await queryOne<RuleCondition>(
      `INSERT INTO "ruleCondition" ("pricingRuleId", "type", "parameters", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.pricingRuleId, params.type, JSON.stringify(params.parameters), now, now],
    );
    if (!result) throw new Error('Failed to create rule condition');
    return result;
  }

  async update(id: string, params: RuleConditionUpdateParams): Promise<RuleCondition | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'parameters' ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<RuleCondition>(
      `UPDATE "ruleCondition" SET ${updateFields.join(', ')} WHERE "ruleConditionId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ ruleConditionId: string }>(
      `DELETE FROM "ruleCondition" WHERE "ruleConditionId" = $1 RETURNING "ruleConditionId"`,
      [id],
    );
    return !!result;
  }

  async deleteByPricingRule(pricingRuleId: string): Promise<number> {
    const results = await query<{ ruleConditionId: string }[]>(
      `DELETE FROM "ruleCondition" WHERE "pricingRuleId" = $1 RETURNING "ruleConditionId"`,
      [pricingRuleId],
    );
    return results ? results.length : 0;
  }

  async count(pricingRuleId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "ruleCondition"`;
    const params: any[] = [];
    if (pricingRuleId) {
      sql += ` WHERE "pricingRuleId" = $1`;
      params.push(pricingRuleId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new RuleConditionRepo();
