/**
 * Admin Inventory Repository
 * Handles legacy inventory queries for the admin hub using the inventoryLevel table
 * with product joins, inventoryLocation, and inventoryTransaction tables
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';

// ============================================================================
// Types
// ============================================================================

export interface InventoryLevelWithProduct {
  inventoryLevelId: string;
  productId: string;
  productVariantId?: string;
  locationId?: string;
  quantity: number;
  reserved: number;
  reorderPoint: number;
  reorderQuantity: number;
  productName?: string;
  sku?: string;
  locationName?: string;
}

export interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

// ============================================================================
// Inventory Level Queries
// ============================================================================

export async function findInventoryLevels(params: {
  search?: string;
  locationId?: string;
  stockStatus?: string;
  limit: number;
  offset: number;
}): Promise<InventoryLevelWithProduct[]> {
  let whereClause = 'WHERE 1=1';
  const queryParams: unknown[] = [];
  let paramIndex = 1;

  if (params.search) {
    whereClause += ` AND (p."name" ILIKE $${paramIndex} OR p."sku" ILIKE $${paramIndex})`;
    queryParams.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params.locationId) {
    whereClause += ` AND il."locationId" = $${paramIndex}`;
    queryParams.push(params.locationId);
  }

  if (params.stockStatus === 'out_of_stock') {
    whereClause += ` AND (il."quantity" - il."reserved") <= 0`;
  } else if (params.stockStatus === 'low_stock') {
    whereClause += ` AND (il."quantity" - il."reserved") > 0 AND (il."quantity" - il."reserved") <= il."reorderPoint"`;
  } else if (params.stockStatus === 'in_stock') {
    whereClause += ` AND (il."quantity" - il."reserved") > il."reorderPoint"`;
  }

  return (
    (await query<InventoryLevelWithProduct[]>(
      `SELECT 
        il."inventoryLevelId",
        il."productId",
        il."productVariantId",
        il."locationId",
        il."quantity",
        il."reserved",
        il."reorderPoint",
        il."reorderQuantity",
        p."name" as "productName",
        p."sku",
        loc."name" as "locationName"
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       LEFT JOIN "inventoryLocation" loc ON il."locationId" = loc."locationId"
       ${whereClause}
       ORDER BY p."name" ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, params.limit, params.offset],
    )) || []
  );
}

export async function countInventoryLevels(params: {
  search?: string;
  locationId?: string;
  stockStatus?: string;
}): Promise<number> {
  let whereClause = 'WHERE 1=1';
  const queryParams: unknown[] = [];
  let paramIndex = 1;

  if (params.search) {
    whereClause += ` AND (p."name" ILIKE $${paramIndex} OR p."sku" ILIKE $${paramIndex})`;
    queryParams.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params.locationId) {
    whereClause += ` AND il."locationId" = $${paramIndex}`;
    queryParams.push(params.locationId);
  }

  if (params.stockStatus === 'out_of_stock') {
    whereClause += ` AND (il."quantity" - il."reserved") <= 0`;
  } else if (params.stockStatus === 'low_stock') {
    whereClause += ` AND (il."quantity" - il."reserved") > 0 AND (il."quantity" - il."reserved") <= il."reorderPoint"`;
  } else if (params.stockStatus === 'in_stock') {
    whereClause += ` AND (il."quantity" - il."reserved") > il."reorderPoint"`;
  }

  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM "inventoryLevel" il
     LEFT JOIN "product" p ON il."productId" = p."productId"
     ${whereClause}`,
    queryParams,
  );
  return parseInt(result?.count || '0');
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const result = await queryOne<Record<string, string>>(
    `SELECT 
      COUNT(*) as "totalProducts",
      SUM(CASE WHEN (il."quantity" - il."reserved") > il."reorderPoint" THEN 1 ELSE 0 END) as "inStock",
      SUM(CASE WHEN (il."quantity" - il."reserved") > 0 AND (il."quantity" - il."reserved") <= il."reorderPoint" THEN 1 ELSE 0 END) as "lowStock",
      SUM(CASE WHEN (il."quantity" - il."reserved") <= 0 THEN 1 ELSE 0 END) as "outOfStock"
     FROM "inventoryLevel" il`,
  );

  return {
    totalProducts: parseInt(result?.totalProducts || '0'),
    inStock: parseInt(result?.inStock || '0'),
    lowStock: parseInt(result?.lowStock || '0'),
    outOfStock: parseInt(result?.outOfStock || '0'),
  };
}

export async function findAllLocations(): Promise<Array<{ locationId: string; name: string }>> {
  return (await query<Array<{ locationId: string; name: string }>>(`SELECT "locationId", "name" FROM "inventoryLocation" ORDER BY "name"`)) || [];
}

export async function findLowStockItems(limit: number = 10): Promise<Record<string, string>[]> {
  return (
    (await query<Record<string, string>[]>(
      `SELECT 
        il."inventoryLevelId",
        p."name" as "productName",
        p."sku",
        (il."quantity" - il."reserved") as "available"
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       WHERE (il."quantity" - il."reserved") > 0 
         AND (il."quantity" - il."reserved") <= il."reorderPoint"
       ORDER BY (il."quantity" - il."reserved") ASC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

// ============================================================================
// Inventory Level Detail
// ============================================================================

export async function findInventoryLevelById(inventoryLevelId: string): Promise<Record<string, string> | null> {
  return queryOne<Record<string, string>>(
    `SELECT il.*, p."name" as "productName", p."sku"
     FROM "inventoryLevel" il
     LEFT JOIN "product" p ON il."productId" = p."productId"
     WHERE il."inventoryLevelId" = $1`,
    [inventoryLevelId],
  );
}

// ============================================================================
// Inventory Transactions
// ============================================================================

export async function findTransactionsByLevelId(inventoryLevelId: string, limit: number, offset: number): Promise<Record<string, string>[]> {
  return (
    (await query<Record<string, string>[]>(
      `SELECT * FROM "inventoryTransaction"
       WHERE "inventoryLevelId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [inventoryLevelId, limit, offset],
    )) || []
  );
}

export async function countTransactionsByLevelId(inventoryLevelId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "inventoryTransaction" WHERE "inventoryLevelId" = $1`,
    [inventoryLevelId],
  );
  return parseInt(result?.count || '0');
}

export async function adjustStockLevel(
  inventoryLevelId: string,
  newQuantity: number,
  previousQuantity: number,
  productId: string,
  locationId: string | undefined,
  adjustmentType: string,
  adjustmentQty: number,
  reason: string,
  notes: string | null,
  userId: string,
): Promise<void> {
  const now = new Date();

  await query(`UPDATE "inventoryLevel" SET "quantity" = $1, "updatedAt" = $2 WHERE "inventoryLevelId" = $3`, [
    newQuantity,
    now,
    inventoryLevelId,
  ]);

  await query(
    `INSERT INTO "inventoryTransaction" (
      "inventoryTransactionId", "inventoryLevelId", "productId", "locationId",
      "transactionType", "quantity", "previousQuantity", "newQuantity",
      "reason", "notes", "createdBy", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      generateUUID(),
      inventoryLevelId,
      productId,
      locationId,
      adjustmentType,
      adjustmentQty,
      previousQuantity,
      newQuantity,
      reason,
      notes,
      userId,
      now,
    ],
  );
}

// ============================================================================
// Locations with Stats
// ============================================================================

export async function findLocationsWithStats(): Promise<Record<string, string>[]> {
  return (
    (await query<Record<string, string>[]>(
      `SELECT 
        loc.*,
        COUNT(il."inventoryLevelId") as "productCount",
        SUM(il."quantity") as "totalStock"
       FROM "inventoryLocation" loc
       LEFT JOIN "inventoryLevel" il ON loc."locationId" = il."locationId"
       GROUP BY loc."locationId"
       ORDER BY loc."name"`,
    )) || []
  );
}

// ============================================================================
// Low Stock Report
// ============================================================================

export async function findLowStockReport(): Promise<Record<string, string>[]> {
  return (
    (await query<Record<string, string>[]>(
      `SELECT 
        il.*,
        p."name" as "productName",
        p."sku",
        loc."name" as "locationName",
        (il."quantity" - il."reserved") as "available"
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       LEFT JOIN "inventoryLocation" loc ON il."locationId" = loc."locationId"
       WHERE (il."quantity" - il."reserved") <= il."reorderPoint"
       ORDER BY (il."quantity" - il."reserved") ASC`,
    )) || []
  );
}

export default {
  findInventoryLevels,
  countInventoryLevels,
  getInventoryStats,
  findAllLocations,
  findLowStockItems,
  findInventoryLevelById,
  findTransactionsByLevelId,
  countTransactionsByLevelId,
  adjustStockLevel,
  findLocationsWithStats,
  findLowStockReport,
};
