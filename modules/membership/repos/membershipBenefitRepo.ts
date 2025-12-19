import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// Import types from generated DB types - single source of truth
import { MembershipBenefit as DbMembershipBenefit } from '../../../libs/db/types';

// Re-export DB type
export type MembershipBenefit = DbMembershipBenefit;

// Import junction table repo for findByPlanId
import membershipPlanBenefitRepo from './membershipPlanBenefitRepo';

// Type aliases for benefit and value types (used in application logic)
export type BenefitType = 'discount' | 'freeShipping' | 'contentAccess' | 'prioritySupport' | 'rewardPoints' | 'gift' | 'earlyAccess' | 'custom';
export type ValueType = 'fixed' | 'percentage' | 'boolean' | 'text' | 'json';

// Derived types for create/update operations
export type MembershipBenefitCreateParams = Omit<MembershipBenefit, 'membershipBenefitId' | 'createdAt' | 'updatedAt'>;
export type MembershipBenefitUpdateParams = Partial<Omit<MembershipBenefit, 'membershipBenefitId' | 'code' | 'createdAt' | 'updatedAt'>>;

export class MembershipBenefitRepo {
  async findById(id: string): Promise<MembershipBenefit | null> {
    return await queryOne<MembershipBenefit>(`SELECT * FROM "membershipBenefit" WHERE "membershipBenefitId" = $1`, [id]);
  }

  async findByPlanId(planId: string, activeOnly = false): Promise<MembershipBenefit[]> {
    // Get plan-benefit relationships from junction table
    const planBenefits = await membershipPlanBenefitRepo.findByPlanId(planId, activeOnly);

    // Get the actual benefit details
    const benefits: MembershipBenefit[] = [];
    for (const planBenefit of planBenefits) {
      const benefit = await this.findById(planBenefit.benefitId);
      if (benefit) {
        benefits.push(benefit);
      }
    }

    return benefits;
  }

  async findByCode(code: string): Promise<MembershipBenefit | null> {
    return await queryOne<MembershipBenefit>(`SELECT * FROM "membershipBenefit" WHERE "code" = $1`, [code]);
  }

  async findAll(activeOnly = false): Promise<MembershipBenefit[]> {
    let sql = `SELECT * FROM "membershipBenefit"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    sql += ` ORDER BY "priority" DESC, "name" ASC`;
    return (await query<MembershipBenefit[]>(sql)) || [];
  }

  async findByType(benefitType: BenefitType, activeOnly = true): Promise<MembershipBenefit[]> {
    let sql = `SELECT * FROM "membershipBenefit" WHERE "benefitType" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" DESC`;
    return (await query<MembershipBenefit[]>(sql, [benefitType])) || [];
  }

  async create(params: MembershipBenefitCreateParams): Promise<MembershipBenefit> {
    const now = unixTimestamp();
    const existing = await this.findByCode(params.code);
    if (existing) throw new Error(`Benefit with code '${params.code}' already exists`);

    const result = await queryOne<MembershipBenefit>(
      `INSERT INTO "membershipBenefit" (
        "name", "code", "description", "shortDescription", "isActive", "priority", "benefitType",
        "valueType", "value", "icon", "rules", "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        params.name, params.code, params.description || null, params.shortDescription || null,
        params.isActive ?? true, params.priority || 0, params.benefitType, params.valueType || 'fixed',
        params.value ? JSON.stringify(params.value) : null, params.icon || null,
        params.rules ? JSON.stringify(params.rules) : null, params.createdBy || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create membership benefit');
    return result;
  }

  async update(id: string, params: MembershipBenefitUpdateParams): Promise<MembershipBenefit | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['value', 'rules'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<MembershipBenefit>(
      `UPDATE "membershipBenefit" SET ${updateFields.join(', ')} WHERE "membershipBenefitId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<MembershipBenefit | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<MembershipBenefit | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ membershipBenefitId: string }>(
      `DELETE FROM "membershipBenefit" WHERE "membershipBenefitId" = $1 RETURNING "membershipBenefitId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "membershipBenefit"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<{ total: number; active: number; byType: Record<BenefitType, number> }> {
    const total = await this.count();
    const active = await this.count(true);

    const typeResults = await query<{ benefitType: BenefitType; count: string }[]>(
      `SELECT "benefitType", COUNT(*) as count FROM "membershipBenefit" WHERE "isActive" = true GROUP BY "benefitType"`
    );
    const byType: Record<string, number> = {};
    typeResults?.forEach(row => { byType[row.benefitType] = parseInt(row.count, 10); });

    return { total, active, byType: byType as Record<BenefitType, number> };
  }
}

export default new MembershipBenefitRepo();
