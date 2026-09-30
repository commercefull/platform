/**
 * Inventory Allocation Rule Repository
 * Read operations for inventory allocation rules (Epic J).
 */

import { query, queryOne } from '../../../../libs/db';
import {
  InventoryAllocationRule,
  type InventoryAllocationRuleProps,
  type AllocationRuleScope,
  type AllocationStrategy,
  type ReservationPolicy,
} from '../../domain/entities/InventoryAllocationRule';
import type { AttributeCondition } from '../../../../libs/rules/conditions';
import type { InventoryAllocationRule as DbInventoryAllocationRule } from '../../../../libs/db/types';

export type InventoryAllocationRuleRow = DbInventoryAllocationRule;

function mapToEntity(row: InventoryAllocationRuleRow): InventoryAllocationRule {
  return new InventoryAllocationRule({
    inventoryAllocationRuleId: row.inventoryAllocationRuleId,
    name: row.name,
    description: row.description ?? undefined,
    scope: row.scope as AllocationRuleScope,
    poolId: row.poolId ?? undefined,
    categoryId: row.categoryId ?? undefined,
    productId: row.productId ?? undefined,
    allocationStrategy: row.allocationStrategy as AllocationStrategy,
    reservationPolicy: row.reservationPolicy as ReservationPolicy,
    lowStockThreshold: row.lowStockThreshold ?? 0,
    oversellBuffer: row.oversellBuffer ?? 0,
    allowBackorder: row.allowBackorder,
    allowOversell: row.allowOversell,
    maxAllocationPerOrder: row.maxAllocationPerOrder ?? 0,
    conditions: (row.conditions as AttributeCondition[] | null) ?? null,
    priority: row.priority,
    isActive: row.isActive,
  });
}

export async function findActiveRules(): Promise<InventoryAllocationRule[]> {
  const rows = await query<InventoryAllocationRuleRow[]>(
    `SELECT * FROM "inventoryAllocationRule" WHERE "isActive" = true ORDER BY "priority" DESC`,
  );
  return (rows || []).map(mapToEntity);
}

export async function findByScope(scope: AllocationRuleScope, activeOnly = true): Promise<InventoryAllocationRule[]> {
  let sql = `SELECT * FROM "inventoryAllocationRule" WHERE "scope" = $1`;
  const params: unknown[] = [scope];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  sql += ` ORDER BY "priority" DESC`;
  const rows = await query<InventoryAllocationRuleRow[]>(sql, params);
  return (rows || []).map(mapToEntity);
}

export async function findByPool(poolId: string, activeOnly = true): Promise<InventoryAllocationRule[]> {
  let sql = `SELECT * FROM "inventoryAllocationRule" WHERE "scope" = 'pool' AND "poolId" = $1`;
  const params: unknown[] = [poolId];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  const rows = await query<InventoryAllocationRuleRow[]>(sql, params);
  return (rows || []).map(mapToEntity);
}

export async function findByProduct(productId: string, activeOnly = true): Promise<InventoryAllocationRule[]> {
  let sql = `SELECT * FROM "inventoryAllocationRule" WHERE "scope" = 'product' AND "productId" = $1`;
  const params: unknown[] = [productId];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  const rows = await query<InventoryAllocationRuleRow[]>(sql, params);
  return (rows || []).map(mapToEntity);
}

export async function findById(inventoryAllocationRuleId: string): Promise<InventoryAllocationRule | null> {
  const row = await queryOne<InventoryAllocationRuleRow>(`SELECT * FROM "inventoryAllocationRule" WHERE "inventoryAllocationRuleId" = $1`, [
    inventoryAllocationRuleId,
  ]);
  return row ? mapToEntity(row) : null;
}

export type CreateInventoryAllocationRuleInput = Omit<InventoryAllocationRuleProps, 'inventoryAllocationRuleId'>;

export async function create(input: CreateInventoryAllocationRuleInput): Promise<InventoryAllocationRule> {
  const row = await queryOne<InventoryAllocationRuleRow>(
    `INSERT INTO "inventoryAllocationRule" (
      "name", "description", "scope", "poolId", "categoryId", "productId",
      "allocationStrategy", "reservationPolicy", "lowStockThreshold", "oversellBuffer",
      "allowBackorder", "allowOversell", "maxAllocationPerOrder", "conditions", "priority", "isActive"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
    [
      input.name,
      input.description ?? null,
      input.scope,
      input.poolId ?? null,
      input.categoryId ?? null,
      input.productId ?? null,
      input.allocationStrategy,
      input.reservationPolicy,
      input.lowStockThreshold,
      input.oversellBuffer,
      input.allowBackorder,
      input.allowOversell,
      input.maxAllocationPerOrder,
      input.conditions ? JSON.stringify(input.conditions) : null,
      input.priority,
      input.isActive,
    ],
  );
  if (!row) throw new Error('Failed to create inventory allocation rule');
  return mapToEntity(row);
}

export default {
  findActiveRules,
  findByScope,
  findByPool,
  findByProduct,
  findById,
  create,
};
