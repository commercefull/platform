/**
 * Operations Controller for Admin Hub
 * Dashboard for operations management
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { adminRespond } from 'web/respond';

// ============================================================================
// Operations Dashboard
// ============================================================================

export const operationsDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get stats
    const fulfillmentStats = await queryOne<any>(
      `SELECT COUNT(*) as "pendingFulfillments"
       FROM "fulfillment"
       WHERE "status" IN ('pending', 'processing') AND "deletedAt" IS NULL`
    );

    const warehouseStats = await queryOne<any>(
      `SELECT COUNT(*) as "activeWarehouses"
       FROM "warehouse"
       WHERE "isActive" = true AND "deletedAt" IS NULL`
    );

    const basketStats = await queryOne<any>(
      `SELECT COUNT(*) as "abandonedCarts"
       FROM "basket"
       WHERE "status" = 'abandoned' AND "deletedAt" IS NULL`
    );

    const inventoryStats = await queryOne<any>(
      `SELECT COUNT(*) as "lowStockItems"
       FROM "inventoryLevel"
       WHERE ("quantity" - "reserved") <= "reorderPoint"`
    );

    const supplierStats = await queryOne<any>(
      `SELECT 
        COUNT(*) as "totalSuppliers",
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as "activeSuppliers"
       FROM "supplier"
       WHERE "deletedAt" IS NULL`
    );

    // Get recent fulfillments
    const recentFulfillments = await query<Array<any>>(
      `SELECT f.*, o."orderNumber"
       FROM "fulfillment" f
       LEFT JOIN "order" o ON f."orderId" = o."orderId"
       WHERE f."deletedAt" IS NULL
       ORDER BY f."createdAt" DESC
       LIMIT 10`
    );

    // Get warehouses
    const warehouses = await query<Array<any>>(
      `SELECT w.*, COUNT(il."inventoryLevelId") as "productCount"
       FROM "warehouse" w
       LEFT JOIN "inventoryLevel" il ON w."warehouseId" = il."locationId"
       WHERE w."deletedAt" IS NULL
       GROUP BY w."warehouseId"
       ORDER BY w."name"`
    );

    adminRespond(req, res, 'operations/dashboard/index', {
      pageName: 'Operations Dashboard',
      stats: {
        pendingFulfillments: parseInt(fulfillmentStats?.pendingFulfillments || '0'),
        activeWarehouses: parseInt(warehouseStats?.activeWarehouses || '0'),
        abandonedCarts: parseInt(basketStats?.abandonedCarts || '0'),
        lowStockItems: parseInt(inventoryStats?.lowStockItems || '0'),
        totalSuppliers: parseInt(supplierStats?.totalSuppliers || '0'),
        activeSuppliers: parseInt(supplierStats?.activeSuppliers || '0'),
        pendingOrders: 0
      },
      recentFulfillments: recentFulfillments || [],
      warehouses: warehouses || [],
    });
  } catch (error: any) {
    console.error('Error loading operations dashboard:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load operations dashboard',
    });
  }
};
