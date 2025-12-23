/**
 * Commission Plan Repository
 *
 * Manages marketplace commission plans for sellers.
 */

import { query, queryOne } from '../../../libs/db';
import { CommissionPlan } from '../../../libs/db/dataModelTypes';

function generateId(): string {
  return `cplan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CommissionRules {
  categoryRules?: Array<{
    categoryId: string;
    percentage: number;
  }>;
  fixedFees?: Array<{
    name: string;
    amount: number;
  }>;
  defaultPercentage?: number;
}

export interface CreateCommissionPlanParams {
  organizationId: string;
  name: string;
  rules: CommissionRules;
  isDefault?: boolean;
}

export async function create(params: CreateCommissionPlanParams): Promise<CommissionPlan> {
  const commissionPlanId = generateId();
  const now = new Date();

  // If setting as default, unset other defaults
  if (params.isDefault) {
    await query('UPDATE "commissionPlan" SET "isDefault" = false WHERE "organizationId" = $1', [params.organizationId]);
  }

  const sql = `
    INSERT INTO "commissionPlan" (
      "commissionPlanId", "organizationId", "name", "rules", "isDefault", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await query<{ rows: CommissionPlan[] }>(sql, [
    commissionPlanId,
    params.organizationId,
    params.name,
    JSON.stringify(params.rules),
    params.isDefault || false,
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(commissionPlanId: string): Promise<CommissionPlan | null> {
  return queryOne<CommissionPlan>('SELECT * FROM "commissionPlan" WHERE "commissionPlanId" = $1', [commissionPlanId]);
}

export async function findByOrganization(organizationId: string): Promise<CommissionPlan[]> {
  const result = await query<{ rows: CommissionPlan[] }>('SELECT * FROM "commissionPlan" WHERE "organizationId" = $1 ORDER BY "name" ASC', [
    organizationId,
  ]);
  return result?.rows ?? [];
}

export async function findDefault(organizationId: string): Promise<CommissionPlan | null> {
  return queryOne<CommissionPlan>('SELECT * FROM "commissionPlan" WHERE "organizationId" = $1 AND "isDefault" = true', [organizationId]);
}

export async function update(
  commissionPlanId: string,
  params: { name?: string; rules?: CommissionRules; isDefault?: boolean },
): Promise<CommissionPlan | null> {
  const current = await findById(commissionPlanId);
  if (!current) return null;

  const updates: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [new Date()];
  let paramIndex = 2;

  if (params.name !== undefined) {
    updates.push(`"name" = $${paramIndex++}`);
    values.push(params.name);
  }
  if (params.rules !== undefined) {
    updates.push(`"rules" = $${paramIndex++}`);
    values.push(JSON.stringify(params.rules));
  }
  if (params.isDefault !== undefined) {
    if (params.isDefault) {
      // Unset other defaults
      await query('UPDATE "commissionPlan" SET "isDefault" = false WHERE "organizationId" = $1', [current.organizationId]);
    }
    updates.push(`"isDefault" = $${paramIndex++}`);
    values.push(params.isDefault);
  }

  values.push(commissionPlanId);
  const sql = `
    UPDATE "commissionPlan" 
    SET ${updates.join(', ')}
    WHERE "commissionPlanId" = $${paramIndex}
    RETURNING *
  `;

  const result = await query<{ rows: CommissionPlan[] }>(sql, values);
  return result?.rows?.[0] ?? null;
}

export function calculateCommission(
  plan: CommissionPlan,
  orderAmount: number,
  categoryId?: string,
): { commission: number; fees: number; total: number } {
  const rules = plan.rules as CommissionRules;
  let percentage = rules.defaultPercentage || 10;

  // Check for category-specific rate
  if (categoryId && rules.categoryRules) {
    const categoryRule = rules.categoryRules.find(r => r.categoryId === categoryId);
    if (categoryRule) {
      percentage = categoryRule.percentage;
    }
  }

  const commission = (orderAmount * percentage) / 100;

  // Calculate fixed fees
  let fees = 0;
  if (rules.fixedFees) {
    fees = rules.fixedFees.reduce((sum, fee) => sum + fee.amount, 0);
  }

  return {
    commission,
    fees,
    total: commission + fees,
  };
}

export default {
  create,
  findById,
  findByOrganization,
  findDefault,
  update,
  calculateCommission,
};
