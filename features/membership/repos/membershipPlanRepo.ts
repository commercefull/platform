/**
 * Membership Plan Repository
 * 
 * Handles all database operations for membership plans.
 * Uses camelCase column names matching the database schema.
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';

// ============================================================================
// Types
// ============================================================================

export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'lifetime';

export interface MembershipPlan {
  membershipPlanId: string;
  name: string;
  code: string;
  description: string | null;
  shortDescription: string | null;
  isActive: boolean;
  isPublic: boolean;
  isDefault: boolean;
  priority: number;
  level: number;
  trialDays: number;
  price: number;
  salePrice: number | null;
  setupFee: number;
  currency: string;
  billingCycle: BillingCycle;
  billingPeriod: number;
  maxMembers: number | null;
  autoRenew: boolean;
  duration: number | null;
  gracePeriodsAllowed: number;
  gracePeriodDays: number;
  membershipImage: string | null;
  publicDetails: Record<string, unknown> | null;
  privateMeta: Record<string, unknown> | null;
  visibilityRules: Record<string, unknown> | null;
  availabilityRules: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export type CreateMembershipPlanInput = Omit<MembershipPlan, 'membershipPlanId' | 'createdAt' | 'updatedAt'>;
export type UpdateMembershipPlanInput = Partial<Omit<MembershipPlan, 'membershipPlanId' | 'code' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Repository Functions
// ============================================================================

const TABLE = Table.MembershipPlan;

/**
 * Find a membership plan by ID
 */
export async function findById(id: string): Promise<MembershipPlan | null> {
  return queryOne<MembershipPlan>(
    `SELECT * FROM "${TABLE}" WHERE "membershipPlanId" = $1`,
    [id]
  );
}

/**
 * Find a membership plan by code
 */
export async function findByCode(code: string): Promise<MembershipPlan | null> {
  return queryOne<MembershipPlan>(
    `SELECT * FROM "${TABLE}" WHERE "code" = $1`,
    [code]
  );
}

/**
 * Find all membership plans
 */
export async function findAll(activeOnly = false): Promise<MembershipPlan[]> {
  let sql = `SELECT * FROM "${TABLE}"`;
  if (activeOnly) {
    sql += ` WHERE "isActive" = true`;
  }
  sql += ` ORDER BY "priority" DESC, "level" ASC`;
  return (await query<MembershipPlan[]>(sql)) || [];
}

/**
 * Find the default membership plan
 */
export async function findDefault(): Promise<MembershipPlan | null> {
  return queryOne<MembershipPlan>(
    `SELECT * FROM "${TABLE}" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
  );
}

/**
 * Find all public membership plans
 */
export async function findPublic(): Promise<MembershipPlan[]> {
  return (await query<MembershipPlan[]>(
    `SELECT * FROM "${TABLE}" WHERE "isPublic" = true AND "isActive" = true ORDER BY "priority" DESC`
  )) || [];
}

/**
 * Create a new membership plan
 */
export async function create(input: CreateMembershipPlanInput): Promise<MembershipPlan> {
  // Check for duplicate code
  const existing = await findByCode(input.code);
  if (existing) {
    throw new Error(`Plan with code '${input.code}' already exists`);
  }

  // If this is the default plan, unset other defaults
  if (input.isDefault) {
    await unsetAllDefaults();
  }

  const result = await queryOne<MembershipPlan>(
    `INSERT INTO "${TABLE}" (
      "name", "code", "description", "shortDescription", "isActive", "isPublic", "isDefault",
      "priority", "level", "trialDays", "price", "salePrice", "setupFee", "currency",
      "billingCycle", "billingPeriod", "maxMembers", "autoRenew", "duration",
      "gracePeriodsAllowed", "gracePeriodDays", "membershipImage", "publicDetails",
      "privateMeta", "visibilityRules", "availabilityRules", "customFields", "createdBy"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
      $20, $21, $22, $23, $24, $25, $26, $27, $28
    ) RETURNING *`,
    [
      input.name,
      input.code,
      input.description || null,
      input.shortDescription || null,
      input.isActive ?? true,
      input.isPublic ?? true,
      input.isDefault ?? false,
      input.priority ?? 0,
      input.level ?? 1,
      input.trialDays ?? 0,
      input.price,
      input.salePrice || null,
      input.setupFee ?? 0,
      input.currency ?? 'USD',
      input.billingCycle ?? 'monthly',
      input.billingPeriod ?? 1,
      input.maxMembers || null,
      input.autoRenew ?? true,
      input.duration || null,
      input.gracePeriodsAllowed ?? 0,
      input.gracePeriodDays ?? 0,
      input.membershipImage || null,
      input.publicDetails ? JSON.stringify(input.publicDetails) : null,
      input.privateMeta ? JSON.stringify(input.privateMeta) : null,
      input.visibilityRules ? JSON.stringify(input.visibilityRules) : null,
      input.availabilityRules ? JSON.stringify(input.availabilityRules) : null,
      input.customFields ? JSON.stringify(input.customFields) : null,
      input.createdBy || null
    ]
  );

  if (!result) {
    throw new Error('Failed to create membership plan');
  }

  return result;
}

/**
 * Update a membership plan
 */
export async function update(id: string, input: UpdateMembershipPlanInput): Promise<MembershipPlan | null> {
  // If setting as default, unset other defaults first
  if (input.isDefault === true) {
    await unsetAllDefaults(id);
  }

  const updateFields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const jsonFields = ['publicDetails', 'privateMeta', 'visibilityRules', 'availabilityRules', 'customFields'];

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  }

  if (updateFields.length === 0) {
    return findById(id);
  }

  updateFields.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<MembershipPlan>(
    `UPDATE "${TABLE}" SET ${updateFields.join(', ')} WHERE "membershipPlanId" = $${paramIndex} RETURNING *`,
    values
  );
}

/**
 * Unset all default plans
 */
async function unsetAllDefaults(exceptId?: string): Promise<void> {
  let sql = `UPDATE "${TABLE}" SET "isDefault" = false, "updatedAt" = NOW() WHERE "isDefault" = true`;
  const params: string[] = [];
  
  if (exceptId) {
    sql += ` AND "membershipPlanId" != $1`;
    params.push(exceptId);
  }
  
  await query(sql, params);
}

/**
 * Activate a membership plan
 */
export async function activate(id: string): Promise<MembershipPlan | null> {
  return update(id, { isActive: true });
}

/**
 * Deactivate a membership plan
 */
export async function deactivate(id: string): Promise<MembershipPlan | null> {
  return update(id, { isActive: false });
}

/**
 * Delete a membership plan
 */
export async function remove(id: string): Promise<boolean> {
  const result = await queryOne<{ membershipPlanId: string }>(
    `DELETE FROM "${TABLE}" WHERE "membershipPlanId" = $1 RETURNING "membershipPlanId"`,
    [id]
  );
  return !!result;
}

/**
 * Count membership plans
 */
export async function count(activeOnly = false): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM "${TABLE}"`;
  if (activeOnly) {
    sql += ` WHERE "isActive" = true`;
  }
  const result = await queryOne<{ count: string }>(sql);
  return result ? parseInt(result.count, 10) : 0;
}

/**
 * Get membership plan statistics
 */
export async function getStatistics(): Promise<{
  total: number;
  active: number;
  public: number;
  byCycle: Record<BillingCycle, number>;
}> {
  const total = await count();
  const active = await count(true);
  
  const publicResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${TABLE}" WHERE "isPublic" = true AND "isActive" = true`
  );
  const publicCount = publicResult ? parseInt(publicResult.count, 10) : 0;

  const cycleResults = await query<{ billingCycle: BillingCycle; count: string }[]>(
    `SELECT "billingCycle", COUNT(*) as count FROM "${TABLE}" WHERE "isActive" = true GROUP BY "billingCycle"`
  );
  
  const byCycle: Record<string, number> = {};
  cycleResults?.forEach(row => {
    byCycle[row.billingCycle] = parseInt(row.count, 10);
  });

  return {
    total,
    active,
    public: publicCount,
    byCycle: byCycle as Record<BillingCycle, number>
  };
}
