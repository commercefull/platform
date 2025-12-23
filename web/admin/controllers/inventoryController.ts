/**
 * Inventory Controller for Admin Hub
 * Manages stock levels, adjustments, and inventory locations
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

interface InventoryLevel {
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

interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

// ============================================================================
// List Inventory
// ============================================================================

export const listInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, stockStatus, locationId, page = '1' } = req.query;
    const limit = 50;
    const offset = (parseInt(page as string) - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (p."name" ILIKE $${paramIndex} OR p."sku" ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (locationId) {
      whereClause += ` AND il."locationId" = $${paramIndex}`;
      params.push(locationId);
      paramIndex++;
    }

    if (stockStatus === 'out_of_stock') {
      whereClause += ` AND (il."quantity" - il."reserved") <= 0`;
    } else if (stockStatus === 'low_stock') {
      whereClause += ` AND (il."quantity" - il."reserved") > 0 AND (il."quantity" - il."reserved") <= il."reorderPoint"`;
    } else if (stockStatus === 'in_stock') {
      whereClause += ` AND (il."quantity" - il."reserved") > il."reorderPoint"`;
    }

    // Get inventory levels with product info
    const inventory = await query<InventoryLevel[]>(
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
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       ${whereClause}`,
      params
    );

    // Get stats
    const stats = await getInventoryStats();

    // Get locations for filter
    const locations = await query<Array<{ locationId: string; name: string }>>(
      `SELECT "locationId", "name" FROM "inventoryLocation" ORDER BY "name"`
    );

    // Get low stock items
    const lowStockItems = await query<Array<any>>(
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
       LIMIT 10`
    );

    const total = parseInt(countResult?.count || '0');

    res.render('admin/views/inventory/index', {
      pageName: 'Inventory',
      inventory: inventory || [],
      stats,
      locations: locations || [],
      lowStockItems: lowStockItems || [],
      pagination: {
        total,
        limit,
        page: parseInt(page as string),
        pages: Math.ceil(total / limit)
      },
      filters: { search, stockStatus, locationId },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error listing inventory:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load inventory',
      user: req.user
    });
  }
};

// ============================================================================
// Adjust Stock
// ============================================================================

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLevelId, adjustmentType, quantity, reason, notes } = req.body;
    const userId = (req as any).user?.userId;

    if (!inventoryLevelId || quantity === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const inventoryLevel = await queryOne<InventoryLevel>(
      `SELECT * FROM "inventoryLevel" WHERE "inventoryLevelId" = $1`,
      [inventoryLevelId]
    );

    if (!inventoryLevel) {
      res.status(404).json({ success: false, message: 'Inventory level not found' });
      return;
    }

    let newQuantity: number;
    const adjustmentQty = parseInt(quantity);

    switch (adjustmentType) {
      case 'add':
        newQuantity = inventoryLevel.quantity + adjustmentQty;
        break;
      case 'remove':
        newQuantity = Math.max(0, inventoryLevel.quantity - adjustmentQty);
        break;
      case 'set':
        newQuantity = adjustmentQty;
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid adjustment type' });
        return;
    }

    const now = new Date();

    // Update inventory level
    await query(
      `UPDATE "inventoryLevel" SET "quantity" = $1, "updatedAt" = $2 WHERE "inventoryLevelId" = $3`,
      [newQuantity, now, inventoryLevelId]
    );

    // Create inventory transaction record
    await query(
      `INSERT INTO "inventoryTransaction" (
        "inventoryTransactionId", "inventoryLevelId", "productId", "locationId",
        "transactionType", "quantity", "previousQuantity", "newQuantity",
        "reason", "notes", "createdBy", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        uuidv4(),
        inventoryLevelId,
        inventoryLevel.productId,
        inventoryLevel.locationId,
        adjustmentType,
        adjustmentQty,
        inventoryLevel.quantity,
        newQuantity,
        reason || 'manual_adjustment',
        notes || null,
        userId,
        now
      ]
    );

    res.json({ success: true, message: 'Stock adjusted successfully', newQuantity });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to adjust stock' });
  }
};

// ============================================================================
// View Inventory History
// ============================================================================

export const viewInventoryHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLevelId } = req.params;
    const { page = '1' } = req.query;
    const limit = 50;
    const offset = (parseInt(page as string) - 1) * limit;

    const inventoryLevel = await queryOne<InventoryLevel>(
      `SELECT il.*, p."name" as "productName", p."sku"
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       WHERE il."inventoryLevelId" = $1`,
      [inventoryLevelId]
    );

    if (!inventoryLevel) {
      res.status(404).render('admin/views/error', {
        pageName: 'Not Found',
        error: 'Inventory level not found',
        user: req.user
      });
      return;
    }

    const transactions = await query<Array<any>>(
      `SELECT * FROM "inventoryTransaction"
       WHERE "inventoryLevelId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [inventoryLevelId, limit, offset]
    );

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "inventoryTransaction" WHERE "inventoryLevelId" = $1`,
      [inventoryLevelId]
    );

    const total = parseInt(countResult?.count || '0');

    res.render('admin/views/inventory/history', {
      pageName: `Inventory History: ${inventoryLevel.productName}`,
      inventoryLevel,
      transactions: transactions || [],
      pagination: {
        total,
        limit,
        page: parseInt(page as string),
        pages: Math.ceil(total / limit)
      },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error viewing inventory history:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load inventory history',
      user: req.user
    });
  }
};

// ============================================================================
// List Locations
// ============================================================================

export const listLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = await query<Array<any>>(
      `SELECT 
        loc.*,
        COUNT(il."inventoryLevelId") as "productCount",
        SUM(il."quantity") as "totalStock"
       FROM "inventoryLocation" loc
       LEFT JOIN "inventoryLevel" il ON loc."locationId" = il."locationId"
       GROUP BY loc."locationId"
       ORDER BY loc."name"`
    );

    res.render('admin/views/inventory/locations', {
      pageName: 'Inventory Locations',
      locations: locations || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error listing locations:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load locations',
      user: req.user
    });
  }
};

// ============================================================================
// Low Stock Report
// ============================================================================

export const lowStockReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const lowStockItems = await query<Array<any>>(
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
       ORDER BY (il."quantity" - il."reserved") ASC`
    );

    res.render('admin/views/inventory/low-stock', {
      pageName: 'Low Stock Report',
      items: lowStockItems || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error generating low stock report:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to generate report',
      user: req.user
    });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

async function getInventoryStats(): Promise<InventoryStats> {
  const result = await queryOne<any>(
    `SELECT 
      COUNT(*) as "totalProducts",
      SUM(CASE WHEN (il."quantity" - il."reserved") > il."reorderPoint" THEN 1 ELSE 0 END) as "inStock",
      SUM(CASE WHEN (il."quantity" - il."reserved") > 0 AND (il."quantity" - il."reserved") <= il."reorderPoint" THEN 1 ELSE 0 END) as "lowStock",
      SUM(CASE WHEN (il."quantity" - il."reserved") <= 0 THEN 1 ELSE 0 END) as "outOfStock"
     FROM "inventoryLevel" il`
  );

  return {
    totalProducts: parseInt(result?.totalProducts || '0'),
    inStock: parseInt(result?.inStock || '0'),
    lowStock: parseInt(result?.lowStock || '0'),
    outOfStock: parseInt(result?.outOfStock || '0')
  };
}
