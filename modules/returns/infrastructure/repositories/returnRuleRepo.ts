/**
 * Return Rule Repository
 * Read operations for return rules (Epic I).
 */

import { query, queryOne } from '../../../../libs/db';
import { ReturnRule, type ReturnRuleProps, type ReturnRuleScope, type RefundMethod } from '../../domain/entities/ReturnRule';
import type { AttributeCondition } from '../../../../libs/rules/conditions';

export interface ReturnRuleRow {
  returnRuleId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  scope: ReturnRuleScope;
  categoryId: string | null;
  productId: string | null;
  returnWindowDays: number | null;
  restockingFeePercent: string | null;
  restockingFeeFlat: string | null;
  returnShippingCost: string | null;
  customerPaysReturnShipping: boolean;
  autoApprove: boolean;
  requiresManualReview: boolean;
  requiresInspection: boolean;
  refundMethod: RefundMethod;
  conditions: unknown | null;
  priority: number;
  isActive: boolean;
}

function mapToEntity(row: ReturnRuleRow): ReturnRule {
  return new ReturnRule({
    returnRuleId: row.returnRuleId,
    name: row.name,
    description: row.description ?? undefined,
    scope: row.scope,
    categoryId: row.categoryId ?? undefined,
    productId: row.productId ?? undefined,
    returnWindowDays: row.returnWindowDays ?? undefined,
    restockingFeePercent: row.restockingFeePercent ? parseFloat(row.restockingFeePercent) : undefined,
    restockingFeeFlat: row.restockingFeeFlat ? parseFloat(row.restockingFeeFlat) : undefined,
    returnShippingCost: row.returnShippingCost ? parseFloat(row.returnShippingCost) : undefined,
    customerPaysReturnShipping: row.customerPaysReturnShipping,
    autoApprove: row.autoApprove,
    requiresManualReview: row.requiresManualReview,
    requiresInspection: row.requiresInspection,
    refundMethod: row.refundMethod,
    conditions: (row.conditions as AttributeCondition[] | null) ?? null,
    priority: row.priority,
    isActive: row.isActive,
  });
}

export async function findActiveRules(): Promise<ReturnRule[]> {
  const rows = await query<ReturnRuleRow[]>(`SELECT * FROM "returnRule" WHERE "isActive" = true ORDER BY "priority" DESC`);
  return (rows || []).map(mapToEntity);
}

export async function findByScope(scope: ReturnRuleScope, activeOnly = true): Promise<ReturnRule[]> {
  let sql = `SELECT * FROM "returnRule" WHERE "scope" = $1`;
  const params: unknown[] = [scope];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  sql += ` ORDER BY "priority" DESC`;
  const rows = await query<ReturnRuleRow[]>(sql, params);
  return (rows || []).map(mapToEntity);
}

export async function findByCategory(categoryId: string, activeOnly = true): Promise<ReturnRule[]> {
  let sql = `SELECT * FROM "returnRule" WHERE "scope" = 'category' AND "categoryId" = $1`;
  const params: unknown[] = [categoryId];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  const rows = await query<ReturnRuleRow[]>(sql, params);
  return (rows || []).map(mapToEntity);
}

export async function findByProduct(productId: string, activeOnly = true): Promise<ReturnRule[]> {
  let sql = `SELECT * FROM "returnRule" WHERE "scope" = 'product' AND "productId" = $1`;
  const params: unknown[] = [productId];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  const rows = await query<ReturnRuleRow[]>(sql, params);
  return (rows || []).map(mapToEntity);
}

export async function findById(returnRuleId: string): Promise<ReturnRule | null> {
  const row = await queryOne<ReturnRuleRow>(`SELECT * FROM "returnRule" WHERE "returnRuleId" = $1`, [returnRuleId]);
  return row ? mapToEntity(row) : null;
}

export type CreateReturnRuleInput = Omit<ReturnRuleProps, 'returnRuleId'>;

export async function create(input: CreateReturnRuleInput): Promise<ReturnRule> {
  const row = await queryOne<ReturnRuleRow>(
    `INSERT INTO "returnRule" (
      "name", "description", "scope", "categoryId", "productId",
      "returnWindowDays", "restockingFeePercent", "restockingFeeFlat", "returnShippingCost",
      "customerPaysReturnShipping", "autoApprove", "requiresManualReview", "requiresInspection",
      "refundMethod", "conditions", "priority", "isActive"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
    [
      input.name,
      input.description ?? null,
      input.scope,
      input.categoryId ?? null,
      input.productId ?? null,
      input.returnWindowDays ?? null,
      input.restockingFeePercent ?? 0,
      input.restockingFeeFlat ?? 0,
      input.returnShippingCost ?? 0,
      input.customerPaysReturnShipping,
      input.autoApprove,
      input.requiresManualReview,
      input.requiresInspection,
      input.refundMethod,
      input.conditions ? JSON.stringify(input.conditions) : null,
      input.priority,
      input.isActive,
    ],
  );
  if (!row) throw new Error('Failed to create return rule');
  return mapToEntity(row);
}

export default {
  findActiveRules,
  findByScope,
  findByCategory,
  findByProduct,
  findById,
  create,
};
