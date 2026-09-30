/**
 * Admin Inventory Repository
 * Handles legacy inventory queries for the admin hub using the inventoryLevel table
 * with product joins and distributionWarehouse locations
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

// available = on-hand minus reserved
const AVAILABLE = `(il."onHandQuantity" - il."reservedQuantity")`;

const ADJUSTMENT_TYPE_CODES: Record<string, string> = {
  add: 'ADJUST_UP',
  remove: 'ADJUST_DOWN',
  set: 'COUNT',
};

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
    whereClause += ` AND il."distributionWarehouseId" = $${paramIndex}`;
    queryParams.push(params.locationId);
    paramIndex++;
  }

  if (params.stockStatus === 'out_of_stock') {
    whereClause += ` AND ${AVAILABLE} <= 0`;
  } else if (params.stockStatus === 'low_stock') {
    whereClause += ` AND ${AVAILABLE} > 0 AND ${AVAILABLE} <= il."reorderQuantity"`;
  } else if (params.stockStatus === 'in_stock') {
    whereClause += ` AND ${AVAILABLE} > il."reorderQuantity"`;
  }

  return (
    (await query<InventoryLevelWithProduct[]>(
      `SELECT 
        il."inventoryLevelId",
        il."productId",
        il."productVariantId",
        il."distributionWarehouseId" as "locationId",
        il."onHandQuantity" as "quantity",
        il."reservedQuantity" as "reserved",
        il."reorderQuantity" as "reorderPoint",
        il."reorderQuantity",
        p."name" as "productName",
        p."sku",
        dw."name" as "locationName"
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       LEFT JOIN "distributionWarehouse" dw ON il."distributionWarehouseId" = dw."distributionWarehouseId"
       ${whereClause}
       ORDER BY p."name" ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, params.limit, params.offset],
    )) || []
  );
}

export async function countInventoryLevels(params: { search?: string; locationId?: string; stockStatus?: string }): Promise<number> {
  let whereClause = 'WHERE 1=1';
  const queryParams: unknown[] = [];
  let paramIndex = 1;

  if (params.search) {
    whereClause += ` AND (p."name" ILIKE $${paramIndex} OR p."sku" ILIKE $${paramIndex})`;
    queryParams.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params.locationId) {
    whereClause += ` AND il."distributionWarehouseId" = $${paramIndex}`;
    queryParams.push(params.locationId);
  }

  if (params.stockStatus === 'out_of_stock') {
    whereClause += ` AND ${AVAILABLE} <= 0`;
  } else if (params.stockStatus === 'low_stock') {
    whereClause += ` AND ${AVAILABLE} > 0 AND ${AVAILABLE} <= il."reorderQuantity"`;
  } else if (params.stockStatus === 'in_stock') {
    whereClause += ` AND ${AVAILABLE} > il."reorderQuantity"`;
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
      SUM(CASE WHEN ${AVAILABLE} > il."reorderQuantity" THEN 1 ELSE 0 END) as "inStock",
      SUM(CASE WHEN ${AVAILABLE} > 0 AND ${AVAILABLE} <= il."reorderQuantity" THEN 1 ELSE 0 END) as "lowStock",
      SUM(CASE WHEN ${AVAILABLE} <= 0 THEN 1 ELSE 0 END) as "outOfStock"
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
  return (
    (await query<Array<{ locationId: string; name: string }>>(
      `SELECT "distributionWarehouseId" as "locationId", "name" FROM "distributionWarehouse" WHERE "isActive" = true ORDER BY "name"`,
    )) || []
  );
}

export async function findLowStockItems(limit: number = 10): Promise<Record<string, string>[]> {
  return (
    (await query<Record<string, string>[]>(
      `SELECT 
        il."inventoryLevelId",
        p."name" as "productName",
        p."sku",
        ${AVAILABLE} as "available"
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       WHERE ${AVAILABLE} > 0 
         AND ${AVAILABLE} <= il."reorderQuantity"
       ORDER BY ${AVAILABLE} ASC
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
    `SELECT il.*, il."onHandQuantity" as "quantity", il."reservedQuantity" as "reserved",
            il."distributionWarehouseId" as "locationId", p."name" as "productName", p."sku"
     FROM "inventoryLevel" il
     LEFT JOIN "product" p ON il."productId" = p."productId"
     WHERE il."inventoryLevelId" = $1`,
    [inventoryLevelId],
  );
}

// ============================================================================
// Inventory Transactions
// ============================================================================

async function findLevelContext(inventoryLevelId: string): Promise<Record<string, string> | null> {
  return queryOne<Record<string, string>>(
    `SELECT "productId", "productVariantId", "distributionWarehouseId", "sku", "onHandQuantity"
     FROM "inventoryLevel" WHERE "inventoryLevelId" = $1`,
    [inventoryLevelId],
  );
}

export async function findTransactionsByLevelId(
  inventoryLevelId: string,
  limit: number,
  offset: number,
): Promise<Record<string, string>[]> {
  const level = await findLevelContext(inventoryLevelId);
  if (!level) return [];

  return (
    (await query<Record<string, string>[]>(
      `SELECT t.*, tt."code" as "transactionType" FROM "inventoryTransaction" t
       LEFT JOIN "inventoryTransactionType" tt ON t."typeId" = tt."inventoryTransactionTypeId"
       WHERE t."productId" = $1 AND t."distributionWarehouseId" = $2
         AND (t."productVariantId" = $3 OR (t."productVariantId" IS NULL AND $3 IS NULL))
       ORDER BY t."createdAt" DESC
       LIMIT $4 OFFSET $5`,
      [level.productId, level.distributionWarehouseId, level.productVariantId ?? null, limit, offset],
    )) || []
  );
}

export async function countTransactionsByLevelId(inventoryLevelId: string): Promise<number> {
  const level = await findLevelContext(inventoryLevelId);
  if (!level) return 0;

  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "inventoryTransaction"
     WHERE "productId" = $1 AND "distributionWarehouseId" = $2
       AND ("productVariantId" = $3 OR ("productVariantId" IS NULL AND $3 IS NULL))`,
    [level.productId, level.distributionWarehouseId, level.productVariantId ?? null],
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
  const level = await findLevelContext(inventoryLevelId);

  await query(`UPDATE "inventoryLevel" SET "onHandQuantity" = $1, "updatedAt" = $2, "updatedBy" = $4 WHERE "inventoryLevelId" = $3`, [
    newQuantity,
    now,
    inventoryLevelId,
    userId,
  ]);

  const typeCode = ADJUSTMENT_TYPE_CODES[adjustmentType] ?? 'COUNT';
  const type = await queryOne<{ inventoryTransactionTypeId: string }>(
    `SELECT "inventoryTransactionTypeId" FROM "inventoryTransactionType" WHERE "code" = $1`,
    [typeCode],
  );

  await query(
    `INSERT INTO "inventoryTransaction" (
      "inventoryTransactionId", "typeId", "distributionWarehouseId", "productId", "productVariantId",
      "sku", "quantity", "previousQuantity", "newQuantity",
      "referenceType", "status", "reason", "notes", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      generateUUID(),
      type?.inventoryTransactionTypeId ?? null,
      level?.distributionWarehouseId ?? locationId,
      productId,
      level?.productVariantId ?? null,
      level?.sku ?? '',
      adjustmentQty,
      previousQuantity,
      newQuantity,
      'manual_adjustment',
      'completed',
      reason,
      notes,
      now,
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
        dw.*,
        COUNT(il."inventoryLevelId") as "productCount",
        SUM(il."onHandQuantity") as "totalStock"
       FROM "distributionWarehouse" dw
       LEFT JOIN "inventoryLevel" il ON dw."distributionWarehouseId" = il."distributionWarehouseId"
       GROUP BY dw."distributionWarehouseId"
       ORDER BY dw."name"`,
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
        dw."name" as "locationName",
        ${AVAILABLE} as "available"
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       LEFT JOIN "distributionWarehouse" dw ON il."distributionWarehouseId" = dw."distributionWarehouseId"
       WHERE ${AVAILABLE} <= il."reorderQuantity"
       ORDER BY ${AVAILABLE} ASC`,
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
