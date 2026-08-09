/**
 * Admin Operations Repository
 * Handles dashboard queries for the operations dashboard in the admin hub
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface OperationsStats {
  pendingFulfillments: number;
  activeWarehouses: number;
  abandonedCarts: number;
  lowStockItems: number;
  totalSuppliers: number;
  activeSuppliers: number;
}

// ============================================================================
// Functions
// ============================================================================

export async function getOperationsStats(): Promise<OperationsStats> {
  const [fulfillmentStats, warehouseStats, basketStats, inventoryStats, supplierStats] = await Promise.all([
    queryOne<{ pendingFulfillments: string }>(
      `SELECT COUNT(*) as "pendingFulfillments"
       FROM "fulfillment"
       WHERE "status" IN ('pending', 'processing') AND "deletedAt" IS NULL`,
    ),
    queryOne<{ activeWarehouses: string }>(
      `SELECT COUNT(*) as "activeWarehouses"
       FROM "warehouse"
       WHERE "isActive" = true AND "deletedAt" IS NULL`,
    ),
    queryOne<{ abandonedCarts: string }>(
      `SELECT COUNT(*) as "abandonedCarts"
       FROM "basket"
       WHERE "status" = 'abandoned' AND "deletedAt" IS NULL`,
    ),
    queryOne<{ lowStockItems: string }>(
      `SELECT COUNT(*) as "lowStockItems"
       FROM "inventoryLevel"
       WHERE ("quantity" - "reserved") <= "reorderPoint"`,
    ),
    queryOne<{ totalSuppliers: string; activeSuppliers: string }>(
      `SELECT 
        COUNT(*) as "totalSuppliers",
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as "activeSuppliers"
       FROM "supplier"
       WHERE "deletedAt" IS NULL`,
    ),
  ]);

  return {
    pendingFulfillments: parseInt(fulfillmentStats?.pendingFulfillments || '0'),
    activeWarehouses: parseInt(warehouseStats?.activeWarehouses || '0'),
    abandonedCarts: parseInt(basketStats?.abandonedCarts || '0'),
    lowStockItems: parseInt(inventoryStats?.lowStockItems || '0'),
    totalSuppliers: parseInt(supplierStats?.totalSuppliers || '0'),
    activeSuppliers: parseInt(supplierStats?.activeSuppliers || '0'),
  };
}

export async function findRecentFulfillments(limit: number = 10): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT f.*, o."orderNumber"
       FROM "fulfillment" f
       LEFT JOIN "order" o ON f."orderId" = o."orderId"
       WHERE f."deletedAt" IS NULL
       ORDER BY f."createdAt" DESC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

export async function findWarehousesWithCounts(): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT w.*, COUNT(il."inventoryLevelId") as "productCount"
       FROM "warehouse" w
       LEFT JOIN "inventoryLevel" il ON w."warehouseId" = il."locationId"
       WHERE w."deletedAt" IS NULL
       GROUP BY w."warehouseId"
       ORDER BY w."name"`,
    )) || []
  );
}

export default {
  getOperationsStats,
  findRecentFulfillments,
  findWarehousesWithCounts,
};
