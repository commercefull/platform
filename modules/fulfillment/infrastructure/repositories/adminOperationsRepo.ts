/**
 * Admin Operations Repository
 * Handles dashboard queries for the operations dashboard in the admin hub
 */

import { query, queryOne } from '../../../../libs/db';
import type { Fulfillment as DbFulfillment, DistributionWarehouse as DbDistributionWarehouse } from '../../../../libs/db/types';

type FulfillmentWithOrderNumberRow = DbFulfillment & { orderNumber: string | null };
type WarehouseWithCountRow = DbDistributionWarehouse & { productCount: string };

// ============================================================================
// Types
// ============================================================================

interface OperationsStats {
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

async function getOperationsStats(): Promise<OperationsStats> {
  const [fulfillmentStats, warehouseStats, basketStats, inventoryStats, supplierStats] = await Promise.all([
    queryOne<{ pendingFulfillments: string }>(
      `SELECT COUNT(*) as "pendingFulfillments"
       FROM "fulfillment"
       WHERE "status" IN ('pending', 'processing')`,
    ),
    queryOne<{ activeWarehouses: string }>(
      `SELECT COUNT(*) as "activeWarehouses"
       FROM "distributionWarehouse"
       WHERE "isActive" = true`,
    ),
    queryOne<{ abandonedCarts: string }>(
      `SELECT COUNT(*) as "abandonedCarts"
       FROM "basket"
       WHERE "status" = 'abandoned'`,
    ),
    queryOne<{ lowStockItems: string }>(
      `SELECT COUNT(*) as "lowStockItems"
       FROM "inventoryLevel"
       WHERE ("onHandQuantity" - "reservedQuantity") <= "reorderQuantity"`,
    ),
    queryOne<{ totalSuppliers: string; activeSuppliers: string }>(
      `SELECT 
        COUNT(*) as "totalSuppliers",
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as "activeSuppliers"
       FROM "supplier"
`,
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

async function findRecentFulfillments(limit: number = 10): Promise<unknown[]> {
  return (
    (await query<FulfillmentWithOrderNumberRow[]>(
      `SELECT f.*, o."orderNumber"
       FROM "fulfillment" f
       LEFT JOIN "order" o ON f."orderId" = o."orderId"::text
       ORDER BY f."createdAt" DESC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

async function findWarehousesWithCounts(): Promise<unknown[]> {
  return (
    (await query<WarehouseWithCountRow[]>(
      `SELECT w.*, COUNT(il."inventoryLevelId") as "productCount"
       FROM "distributionWarehouse" w
       LEFT JOIN "inventoryLevel" il ON w."distributionWarehouseId" = il."distributionWarehouseId"
       GROUP BY w."distributionWarehouseId"
       ORDER BY w."name"`,
    )) || []
  );
}

export default {
  getOperationsStats,
  findRecentFulfillments,
  findWarehousesWithCounts,
};
