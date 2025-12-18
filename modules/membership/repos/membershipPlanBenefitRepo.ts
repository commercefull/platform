import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface MembershipPlanBenefit {
  membershipPlanBenefitId: string;
  createdAt: string;
  updatedAt: string;
  planId: string;
  benefitId: string;
  isActive: boolean;
  priority: number;
  valueOverride?: Record<string, any>;
  rulesOverride?: Record<string, any>;
  notes?: string;
}

export type MembershipPlanBenefitCreateParams = Omit<MembershipPlanBenefit, 'membershipPlanBenefitId' | 'createdAt' | 'updatedAt'>;
export type MembershipPlanBenefitUpdateParams = Partial<Pick<MembershipPlanBenefit, 'isActive' | 'priority' | 'valueOverride' | 'rulesOverride' | 'notes'>>;

export class MembershipPlanBenefitRepo {
  async findById(id: string): Promise<MembershipPlanBenefit | null> {
    return await queryOne<MembershipPlanBenefit>(
      `SELECT * FROM "membershipPlanBenefit" WHERE "membershipPlanBenefitId" = $1`,
      [id]
    );
  }

  async findByPlanId(planId: string, activeOnly = false): Promise<MembershipPlanBenefit[]> {
    let sql = `SELECT * FROM "membershipPlanBenefit" WHERE "planId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" DESC`;
    return (await query<MembershipPlanBenefit[]>(sql, [planId])) || [];
  }

  async findByBenefitId(benefitId: string): Promise<MembershipPlanBenefit[]> {
    return (await query<MembershipPlanBenefit[]>(
      `SELECT * FROM "membershipPlanBenefit" WHERE "benefitId" = $1 ORDER BY "priority" DESC`,
      [benefitId]
    )) || [];
  }

  async findByPlanAndBenefit(planId: string, benefitId: string): Promise<MembershipPlanBenefit | null> {
    return await queryOne<MembershipPlanBenefit>(
      `SELECT * FROM "membershipPlanBenefit" WHERE "planId" = $1 AND "benefitId" = $2`,
      [planId, benefitId]
    );
  }

  async create(params: MembershipPlanBenefitCreateParams): Promise<MembershipPlanBenefit> {
    const now = unixTimestamp();

    // Check if already exists
    const existing = await this.findByPlanAndBenefit(params.planId, params.benefitId);
    if (existing) {
      throw new Error('Benefit already assigned to this plan');
    }

    const result = await queryOne<MembershipPlanBenefit>(
      `INSERT INTO "membershipPlanBenefit" (
        "planId", "benefitId", "isActive", "priority", "valueOverride", "rulesOverride", "notes",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        params.planId, params.benefitId, params.isActive ?? true, params.priority || 0,
        params.valueOverride ? JSON.stringify(params.valueOverride) : null,
        params.rulesOverride ? JSON.stringify(params.rulesOverride) : null,
        params.notes || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create plan benefit');
    return result;
  }

  async update(id: string, params: MembershipPlanBenefitUpdateParams): Promise<MembershipPlanBenefit | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['valueOverride', 'rulesOverride'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<MembershipPlanBenefit>(
      `UPDATE "membershipPlanBenefit" SET ${updateFields.join(', ')} WHERE "membershipPlanBenefitId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async reorder(planId: string, benefitPriorities: Array<{ benefitId: string; priority: number }>): Promise<void> {
    const now = unixTimestamp();
    for (const item of benefitPriorities) {
      const planBenefit = await this.findByPlanAndBenefit(planId, item.benefitId);
      if (planBenefit) {
        await this.update(planBenefit.membershipPlanBenefitId, { priority: item.priority });
      }
    }
  }

  async activate(id: string): Promise<MembershipPlanBenefit | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<MembershipPlanBenefit | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ membershipPlanBenefitId: string }>(
      `DELETE FROM "membershipPlanBenefit" WHERE "membershipPlanBenefitId" = $1 RETURNING "membershipPlanBenefitId"`,
      [id]
    );
    return !!result;
  }

  async deleteByPlanId(planId: string): Promise<number> {
    const results = await query<{ membershipPlanBenefitId: string }[]>(
      `DELETE FROM "membershipPlanBenefit" WHERE "planId" = $1 RETURNING "membershipPlanBenefitId"`,
      [planId]
    );
    return results ? results.length : 0;
  }

  async count(planId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "membershipPlanBenefit"`;
    const params: any[] = [];

    if (planId) {
      sql += ` WHERE "planId" = $1`;
      params.push(planId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new MembershipPlanBenefitRepo();
