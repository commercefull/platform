/**
 * Merchant Inventory Controller
 * Merchant-scoped inventory management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { merchantRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: List inventory for merchant's products
 */
export const listInventory = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const page = parseInt(req.query.page as string) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    const filter = req.query.filter as string || 'all';

    let whereClause = 'WHERE il."merchantId" = $1';
    const params: any[] = [merchantId];
    let paramIdx = 2;

    if (search) {
      whereClause += ` AND (il."sku" ILIKE $${paramIdx} OR il."productName" ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (filter === 'low-stock') {
      whereClause += ` AND il."quantity" <= il."lowStockThreshold" AND il."quantity" > 0`;
    } else if (filter === 'out-of-stock') {
      whereClause += ` AND il."quantity" = 0`;
    }

    const countResult = await queryOne(`SELECT COUNT(*) as total FROM "inventoryLevel" il ${whereClause}`, params);
    const total = parseInt((countResult as any)?.total || '0');

    const items = await query(
      `SELECT il.*, w."name" as "warehouseName"
       FROM "inventoryLevel" il
       LEFT JOIN "warehouse" w ON il."warehouseId" = w."warehouseId"
       ${whereClause}
       ORDER BY il."updatedAt" DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset],
    );

    const totalPages = Math.ceil(total / limit);

    merchantRespond(req, res, 'inventory/list', {
      pageName: 'Inventory',
      items,
      pagination: { page, totalPages, total, limit },
      search,
      filter,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load inventory' });
  }
};

/**
 * POST: Adjust stock for a product
 */
export const adjustStock = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { inventoryLevelId, adjustment, reason } = req.body;

    if (!inventoryLevelId || adjustment === undefined) {
      (req as any).flash?.('error', 'Inventory level and adjustment amount are required');
      return res.redirect('/merchant/inventory');
    }

    // Verify ownership
    const item = await queryOne(
      `SELECT * FROM "inventoryLevel" WHERE "inventoryLevelId" = $1 AND "merchantId" = $2`,
      [inventoryLevelId, merchantId],
    );

    if (!item) {
      (req as any).flash?.('error', 'Inventory item not found');
      return res.redirect('/merchant/inventory');
    }

    const newQuantity = (item as any).quantity + parseInt(adjustment);
    await query(
      `UPDATE "inventoryLevel" SET "quantity" = $1, "updatedAt" = NOW() WHERE "inventoryLevelId" = $2`,
      [newQuantity, inventoryLevelId],
    );

    // Log the adjustment
    await query(
      `INSERT INTO "inventoryMovement" ("inventoryLevelId", "type", "quantity", "reason", "createdBy", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [inventoryLevelId, parseInt(adjustment) > 0 ? 'addition' : 'reduction', Math.abs(parseInt(adjustment)), reason || 'Manual adjustment', req.user?.userId || ''],
    );

    (req as any).flash?.('success', 'Stock adjusted successfully');
    res.redirect('/merchant/inventory');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to adjust stock');
    res.redirect('/merchant/inventory');
  }
};

/**
 * GET: Low stock alerts for merchant
 */
export const lowStockAlerts = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const items = await query(
      `SELECT il.*, w."name" as "warehouseName"
       FROM "inventoryLevel" il
       LEFT JOIN "warehouse" w ON il."warehouseId" = w."warehouseId"
       WHERE il."merchantId" = $1 AND il."quantity" <= il."lowStockThreshold"
       ORDER BY il."quantity" ASC`,
      [merchantId],
    );

    merchantRespond(req, res, 'inventory/low-stock', {
      pageName: 'Low Stock Alerts',
      items,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load low stock alerts' });
  }
};
