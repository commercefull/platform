/**
 * Merchandising Rules Service
 *
 * Manages boost/bury/pin rules and per-category manual ordering.
 * Rules are stored in the database and applied at query time by the search adapter.
 */

import { query } from '../db';
import { logger } from '../logger';
import type { MerchandisingContext, ManualOrderingContext, PinnedProduct } from './types';

// ============================================================================
// Types
// ============================================================================

export interface MerchandisingRule {
  ruleId: string;
  ruleType: 'boost' | 'bury' | 'pin';
  productId: string;
  position?: number;
  searchTerm?: string;
  categoryId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryManualOrder {
  orderId: string;
  categoryId: string;
  productId: string;
  position: number;
  isActive: boolean;
}

// ============================================================================
// Merchandising Rule Service
// ============================================================================

/**
 * Get active merchandising rules for a search context
 */
export async function getMerchandisingRules(
  searchTerm?: string,
  categoryId?: string,
): Promise<MerchandisingContext> {
  try {
    const conditions: string[] = ['"isActive" = true'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (searchTerm) {
      conditions.push(`("searchTerm" IS NULL OR "searchTerm" = $${paramIndex})`);
      params.push(searchTerm);
      paramIndex++;
    }
    if (categoryId) {
      conditions.push(`("categoryId" IS NULL OR "categoryId" = $${paramIndex})`);
      params.push(categoryId);
      paramIndex++;
    }

    const results = await query<MerchandisingRule[]>(
      `SELECT * FROM "merchandisingRule" WHERE ${conditions.join(' AND ')} ORDER BY "position" ASC`,
      params,
    );

    if (!results || results.length === 0) return {};

    const boostProductIds: string[] = [];
    const buryProductIds: string[] = [];
    const pinnedProducts: PinnedProduct[] = [];

    for (const rule of results) {
      switch (rule.ruleType) {
        case 'boost':
          boostProductIds.push(rule.productId);
          break;
        case 'bury':
          buryProductIds.push(rule.productId);
          break;
        case 'pin':
          pinnedProducts.push({
            productId: rule.productId,
            position: rule.position ?? 0,
          });
          break;
      }
    }

    return {
      boostProductIds: boostProductIds.length > 0 ? boostProductIds : undefined,
      buryProductIds: buryProductIds.length > 0 ? buryProductIds : undefined,
      pinnedProducts: pinnedProducts.length > 0 ? pinnedProducts : undefined,
    };
  } catch (error) {
    logger.warn('Failed to load merchandising rules', { error: (error as Error).message });
    return {};
  }
}

/**
 * Get manual ordering for a category
 */
export async function getCategoryManualOrder(
  categoryId: string,
): Promise<ManualOrderingContext | undefined> {
  try {
    const results = await query<CategoryManualOrder[]>(
      `SELECT * FROM "categoryManualOrder" WHERE "categoryId" = $1 AND "isActive" = true ORDER BY "position" ASC`,
      [categoryId],
    );

    if (!results || results.length === 0) return undefined;

    return {
      categoryId,
      productIds: results.map(r => r.productId),
    };
  } catch (error) {
    logger.warn('Failed to load category manual order', { categoryId, error: (error as Error).message });
    return undefined;
  }
}

// ============================================================================
// Admin: CRUD operations for merchandising rules
// ============================================================================

export async function createMerchandisingRule(
  rule: Omit<MerchandisingRule, 'ruleId' | 'createdAt' | 'updatedAt'>,
): Promise<MerchandisingRule> {
  const results = await query<MerchandisingRule[]>(
    `INSERT INTO "merchandisingRule" ("ruleType", "productId", "position", "searchTerm", "categoryId", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [rule.ruleType, rule.productId, rule.position ?? null, rule.searchTerm ?? null, rule.categoryId ?? null, rule.isActive ?? true],
  );

  return results![0];
}

export async function updateMerchandisingRule(
  ruleId: string,
  updates: Partial<MerchandisingRule>,
): Promise<MerchandisingRule | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [ruleId];
  let paramIndex = 2;

  if (updates.ruleType !== undefined) {
    setClauses.push(`"ruleType" = $${paramIndex++}`);
    params.push(updates.ruleType);
  }
  if (updates.productId !== undefined) {
    setClauses.push(`"productId" = $${paramIndex++}`);
    params.push(updates.productId);
  }
  if (updates.position !== undefined) {
    setClauses.push(`"position" = $${paramIndex++}`);
    params.push(updates.position);
  }
  if (updates.searchTerm !== undefined) {
    setClauses.push(`"searchTerm" = $${paramIndex++}`);
    params.push(updates.searchTerm);
  }
  if (updates.categoryId !== undefined) {
    setClauses.push(`"categoryId" = $${paramIndex++}`);
    params.push(updates.categoryId);
  }
  if (updates.isActive !== undefined) {
    setClauses.push(`"isActive" = $${paramIndex}`);
    params.push(updates.isActive);
  }

  setClauses.push(`"updatedAt" = NOW()`);

  const results = await query<MerchandisingRule[]>(
    `UPDATE "merchandisingRule" SET ${setClauses.join(', ')} WHERE "ruleId" = $1 RETURNING *`,
    params,
  );

  return results?.[0] ?? null;
}

export async function deleteMerchandisingRule(ruleId: string): Promise<boolean> {
  await query(`DELETE FROM "merchandisingRule" WHERE "ruleId" = $1`, [ruleId]);
  return true;
}

export async function listMerchandisingRules(filters?: {
  ruleType?: string;
  categoryId?: string;
  isActive?: boolean;
}): Promise<MerchandisingRule[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.ruleType) {
    conditions.push(`"ruleType" = $${paramIndex++}`);
    params.push(filters.ruleType);
  }
  if (filters?.categoryId) {
    conditions.push(`"categoryId" = $${paramIndex++}`);
    params.push(filters.categoryId);
  }
  if (filters?.isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex}`);
    params.push(filters.isActive);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const results = await query<MerchandisingRule[]>(
    `SELECT * FROM "merchandisingRule" ${whereClause} ORDER BY "createdAt" DESC`,
    params,
  );

  return results || [];
}

// ============================================================================
// Admin: CRUD operations for category manual ordering
// ============================================================================

export async function setCategoryManualOrder(
  categoryId: string,
  productIds: string[],
): Promise<void> {
  // Delete existing orders for this category
  await query(`DELETE FROM "categoryManualOrder" WHERE "categoryId" = $1`, [categoryId]);

  // Insert new orders
  for (let i = 0; i < productIds.length; i++) {
    await query(
      `INSERT INTO "categoryManualOrder" ("categoryId", "productId", "position", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())`,
      [categoryId, productIds[i], i],
    );
  }
}

export async function getCategoryManualOrderList(categoryId: string): Promise<CategoryManualOrder[]> {
  const results = await query<CategoryManualOrder[]>(
    `SELECT * FROM "categoryManualOrder" WHERE "categoryId" = $1 ORDER BY "position" ASC`,
    [categoryId],
  );
  return results || [];
}

export async function deleteCategoryManualOrder(categoryId: string): Promise<void> {
  await query(`DELETE FROM "categoryManualOrder" WHERE "categoryId" = $1`, [categoryId]);
}
