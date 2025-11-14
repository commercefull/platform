import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'lifetime';

export interface MembershipPlan {
  membershipPlanId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description?: string;
  shortDescription?: string;
  isActive: boolean;
  isPublic: boolean;
  isDefault: boolean;
  priority: number;
  level: number;
  trialDays: number;
  price: number;
  salePrice?: number;
  setupFee: number;
  currency: string;
  billingCycle: BillingCycle;
  billingPeriod: number;
  maxMembers?: number;
  autoRenew: boolean;
  duration?: number;
  gracePeriodsAllowed: number;
  gracePeriodDays: number;
  membershipImage?: string;
  publicDetails?: Record<string, any>;
  privateMeta?: Record<string, any>;
  visibilityRules?: Record<string, any>;
  availabilityRules?: Record<string, any>;
  customFields?: Record<string, any>;
  createdBy?: string;
}

export type MembershipPlanCreateParams = Omit<MembershipPlan, 'membershipPlanId' | 'createdAt' | 'updatedAt'>;
export type MembershipPlanUpdateParams = Partial<Omit<MembershipPlan, 'membershipPlanId' | 'code' | 'createdAt' | 'updatedAt'>>;

export class MembershipPlanRepo {
  async findById(id: string): Promise<MembershipPlan | null> {
    return await queryOne<MembershipPlan>(`SELECT * FROM "membershipPlan" WHERE "membershipPlanId" = $1`, [id]);
  }

  async findByCode(code: string): Promise<MembershipPlan | null> {
    return await queryOne<MembershipPlan>(`SELECT * FROM "membershipPlan" WHERE "code" = $1`, [code]);
  }

  async findAll(activeOnly = false): Promise<MembershipPlan[]> {
    let sql = `SELECT * FROM "membershipPlan"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    sql += ` ORDER BY "priority" DESC, "level" ASC`;
    return (await query<MembershipPlan[]>(sql)) || [];
  }

  async findDefault(): Promise<MembershipPlan | null> {
    return await queryOne<MembershipPlan>(
      `SELECT * FROM "membershipPlan" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
    );
  }

  async findPublic(): Promise<MembershipPlan[]> {
    return (await query<MembershipPlan[]>(
      `SELECT * FROM "membershipPlan" WHERE "isPublic" = true AND "isActive" = true ORDER BY "priority" DESC`
    )) || [];
  }

  async create(params: MembershipPlanCreateParams): Promise<MembershipPlan> {
    const now = unixTimestamp();
    const existing = await this.findByCode(params.code);
    if (existing) throw new Error(`Plan with code '${params.code}' already exists`);

    if (params.isDefault) await this.unsetAllDefaults();

    const result = await queryOne<MembershipPlan>(
      `INSERT INTO "membershipPlan" (
        "name", "code", "description", "shortDescription", "isActive", "isPublic", "isDefault",
        "priority", "level", "trialDays", "price", "salePrice", "setupFee", "currency",
        "billingCycle", "billingPeriod", "maxMembers", "autoRenew", "duration",
        "gracePeriodsAllowed", "gracePeriodDays", "membershipImage", "publicDetails",
        "privateMeta", "visibilityRules", "availabilityRules", "customFields", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *`,
      [
        params.name, params.code, params.description || null, params.shortDescription || null,
        params.isActive ?? true, params.isPublic ?? true, params.isDefault || false,
        params.priority || 0, params.level || 1, params.trialDays || 0, params.price,
        params.salePrice || null, params.setupFee || 0, params.currency || 'USD',
        params.billingCycle || 'monthly', params.billingPeriod || 1, params.maxMembers || null,
        params.autoRenew ?? true, params.duration || null, params.gracePeriodsAllowed || 0,
        params.gracePeriodDays || 0, params.membershipImage || null,
        params.publicDetails ? JSON.stringify(params.publicDetails) : null,
        params.privateMeta ? JSON.stringify(params.privateMeta) : null,
        params.visibilityRules ? JSON.stringify(params.visibilityRules) : null,
        params.availabilityRules ? JSON.stringify(params.availabilityRules) : null,
        params.customFields ? JSON.stringify(params.customFields) : null,
        params.createdBy || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create membership plan');
    return result;
  }

  async update(id: string, params: MembershipPlanUpdateParams): Promise<MembershipPlan | null> {
    if (params.isDefault === true) await this.unsetAllDefaults(id);

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['publicDetails', 'privateMeta', 'visibilityRules', 'availabilityRules', 'customFields'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<MembershipPlan>(
      `UPDATE "membershipPlan" SET ${updateFields.join(', ')} WHERE "membershipPlanId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  private async unsetAllDefaults(exceptId?: string): Promise<void> {
    let sql = `UPDATE "membershipPlan" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true`;
    const params: any[] = [unixTimestamp()];
    if (exceptId) {
      sql += ` AND "membershipPlanId" != $2`;
      params.push(exceptId);
    }
    await query(sql, params);
  }

  async activate(id: string): Promise<MembershipPlan | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<MembershipPlan | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ membershipPlanId: string }>(
      `DELETE FROM "membershipPlan" WHERE "membershipPlanId" = $1 RETURNING "membershipPlanId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "membershipPlan"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<{ total: number; active: number; public: number; byCycle: Record<BillingCycle, number> }> {
    const total = await this.count();
    const active = await this.count(true);
    const publicResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "membershipPlan" WHERE "isPublic" = true AND "isActive" = true`
    );
    const publicCount = publicResult ? parseInt(publicResult.count, 10) : 0;

    const cycleResults = await query<{ billingCycle: BillingCycle; count: string }[]>(
      `SELECT "billingCycle", COUNT(*) as count FROM "membershipPlan" WHERE "isActive" = true GROUP BY "billingCycle"`
    );
    const byCycle: Record<string, number> = {};
    cycleResults?.forEach(row => { byCycle[row.billingCycle] = parseInt(row.count, 10); });

    return { total, active, public: publicCount, byCycle: byCycle as Record<BillingCycle, number> };
  }
}

export default new MembershipPlanRepo();
