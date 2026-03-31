/**
 * Inventory Controller for Admin Hub
 * Manages stock levels, adjustments, and inventory locations
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';;
import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';
import { adminRespond } from '../../respond';
import inventoryRepository from '../../../modules/inventory/infrastructure/repositories/InventoryRepository';
import storeDispatchRepository from '../../../modules/inventory/infrastructure/repositories/StoreDispatchRepository';
import StoreRepo from '../../../modules/store/infrastructure/repositories/StoreRepo';
import { ListStoreDispatchesUseCase } from '../../../modules/inventory/application/useCases/ListStoreDispatches';
import { GetStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/GetStoreDispatch';
import { CreateStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/CreateStoreDispatch';
import { ApproveStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/ApproveStoreDispatch';
import { DispatchFromStoreUseCase } from '../../../modules/inventory/application/useCases/DispatchFromStore';
import { ReceiveStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/ReceiveStoreDispatch';
import { CancelStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/CancelStoreDispatch';

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

const listStoreDispatchesUseCase = new ListStoreDispatchesUseCase(storeDispatchRepository);
const getStoreDispatchUseCase = new GetStoreDispatchUseCase(storeDispatchRepository);
const createStoreDispatchUseCase = new CreateStoreDispatchUseCase(storeDispatchRepository, inventoryRepository);
const approveStoreDispatchUseCase = new ApproveStoreDispatchUseCase(storeDispatchRepository, inventoryRepository);
const dispatchFromStoreUseCase = new DispatchFromStoreUseCase(storeDispatchRepository, inventoryRepository);
const receiveStoreDispatchUseCase = new ReceiveStoreDispatchUseCase(storeDispatchRepository, inventoryRepository);
const cancelStoreDispatchUseCase = new CancelStoreDispatchUseCase(storeDispatchRepository);

// ============================================================================
// List Inventory
// ============================================================================

export const listInventory = async (req: TypedRequest, res: Response): Promise<void> => {
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
      [...params, limit, offset],
    );

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM "inventoryLevel" il
       LEFT JOIN "product" p ON il."productId" = p."productId"
       ${whereClause}`,
      params,
    );

    // Get stats
    const stats = await getInventoryStats();

    // Get locations for filter
    const locations = await query<Array<{ locationId: string; name: string }>>(
      `SELECT "locationId", "name" FROM "inventoryLocation" ORDER BY "name"`,
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
       LIMIT 10`,
    );

    const total = parseInt(countResult?.count || '0');

    adminRespond(req, res, 'inventory/index', {
      pageName: 'Inventory',
      inventory: inventory || [],
      stats,
      locations: locations || [],
      lowStockItems: lowStockItems || [],
      pagination: {
        total,
        limit,
        page: parseInt(page as string),
        pages: Math.ceil(total / limit),
      },
      filters: { search, stockStatus, locationId },
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load inventory',
    });
  }
};

// ============================================================================
// Adjust Stock
// ============================================================================

export const adjustStock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { inventoryLevelId, adjustmentType, quantity, reason, notes } = req.body;
    const userId = (req as any).user?.userId;

    if (!inventoryLevelId || quantity === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const inventoryLevel = await queryOne<InventoryLevel>(`SELECT * FROM "inventoryLevel" WHERE "inventoryLevelId" = $1`, [
      inventoryLevelId,
    ]);

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
    await query(`UPDATE "inventoryLevel" SET "quantity" = $1, "updatedAt" = $2 WHERE "inventoryLevelId" = $3`, [
      newQuantity,
      now,
      inventoryLevelId,
    ]);

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
        now,
      ],
    );

    res.json({ success: true, message: 'Stock adjusted successfully', newQuantity });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to adjust stock' });
  }
};

// ============================================================================
// View Inventory History
// ============================================================================

export const viewInventoryHistory = async (req: TypedRequest, res: Response): Promise<void> => {
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
      [inventoryLevelId],
    );

    if (!inventoryLevel) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Inventory level not found',
      });
      return;
    }

    const transactions = await query<Array<any>>(
      `SELECT * FROM "inventoryTransaction"
       WHERE "inventoryLevelId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [inventoryLevelId, limit, offset],
    );

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "inventoryTransaction" WHERE "inventoryLevelId" = $1`,
      [inventoryLevelId],
    );

    const total = parseInt(countResult?.count || '0');

    adminRespond(req, res, 'inventory/history', {
      pageName: `Inventory History: ${inventoryLevel.productName}`,
      inventoryLevel,
      transactions: transactions || [],
      pagination: {
        total,
        limit,
        page: parseInt(page as string),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load inventory history',
    });
  }
};

// ============================================================================
// List Locations
// ============================================================================

export const listLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const locations = await query<Array<any>>(
      `SELECT 
        loc.*,
        COUNT(il."inventoryLevelId") as "productCount",
        SUM(il."quantity") as "totalStock"
       FROM "inventoryLocation" loc
       LEFT JOIN "inventoryLevel" il ON loc."locationId" = il."locationId"
       GROUP BY loc."locationId"
       ORDER BY loc."name"`,
    );

    adminRespond(req, res, 'inventory/locations', {
      pageName: 'Inventory Locations',
      locations: locations || [],
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load locations',
    });
  }
};

// ============================================================================
// Low Stock Report
// ============================================================================

export const lowStockReport = async (req: TypedRequest, res: Response): Promise<void> => {
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
       ORDER BY (il."quantity" - il."reserved") ASC`,
    );

    adminRespond(req, res, 'inventory/low-stock', {
      pageName: 'Low Stock Report',
      items: lowStockItems || [],
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to generate report',
    });
  }
};

export const listDispatches = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const requestedStatus = req.query.status as string | undefined;
    const status =
      requestedStatus && ['draft', 'approved', 'dispatched', 'in_transit', 'received', 'cancelled'].includes(requestedStatus)
        ? (requestedStatus as 'draft' | 'approved' | 'dispatched' | 'in_transit' | 'received' | 'cancelled')
        : undefined;

    const result = await listStoreDispatchesUseCase.execute({
      status,
      fromStoreId: req.query.fromStoreId as string | undefined,
      toStoreId: req.query.toStoreId as string | undefined,
      limit: 50,
      offset: 0,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
    const stores = await StoreRepo.findActive();
    adminRespond(req, res, 'inventory/dispatches/index', {
      pageName: 'Dispatches',
      dispatches: result.dispatches,
      stores,
      filters: req.query,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load dispatches' });
  }
};

export const createDispatchForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stores = await StoreRepo.findActive();
    adminRespond(req, res, 'inventory/dispatches/create', { pageName: 'Create Dispatch', stores, formData: {} });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load dispatch form' });
  }
};

export const createDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const items = Array.isArray(req.body.items)
      ? req.body.items
      : req.body.productId
        ? [{ productId: req.body.productId, variantId: req.body.variantId || undefined, quantity: parseInt(req.body.quantity || '0', 10), sku: req.body.sku || undefined, productName: req.body.productName || undefined }]
        : [];

    const dispatch = await createStoreDispatchUseCase.execute({
      fromStoreId: req.body.fromStoreId,
      toStoreId: req.body.toStoreId,
      items,
      notes: req.body.notes || undefined,
      requestedBy: (req as any).user?.userId || 'admin',
    });
    res.redirect(`/admin/dispatches/${dispatch.dispatchId}?success=Dispatch created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    const stores = await StoreRepo.findActive().catch(() => []);
    adminRespond(req, res, 'inventory/dispatches/create', { pageName: 'Create Dispatch', stores, formData: req.body, error: error.message || 'Failed to create dispatch' });
  }
};

export const viewDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const dispatch = await getStoreDispatchUseCase.execute(req.params.dispatchId);
    if (!dispatch) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Dispatch not found' });
      return;
    }
    adminRespond(req, res, 'inventory/dispatches/view', { pageName: dispatch.dispatchNumber, dispatch });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load dispatch' });
  }
};

export const approveDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await approveStoreDispatchUseCase.execute(req.params.dispatchId, (req as any).user?.userId || 'admin');
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch approved successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent(error.message || 'Failed to approve dispatch')}`);
  }
};

export const markDispatched = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await dispatchFromStoreUseCase.execute(req.params.dispatchId, (req as any).user?.userId || 'admin');
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch marked as shipped`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent(error.message || 'Failed to ship dispatch')}`);
  }
};

export const receiveDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const dispatch = await getStoreDispatchUseCase.execute(req.params.dispatchId);
    if (!dispatch) {
      throw new Error('Dispatch not found');
    }
    await receiveStoreDispatchUseCase.execute({
      dispatchId: req.params.dispatchId,
      receivedBy: (req as any).user?.userId || 'admin',
      notes: req.body.notes || undefined,
      items: (dispatch.items || []).map((item: any) => ({ dispatchItemId: item.dispatchItemId, receivedQuantity: item.dispatchedQuantity || item.requestedQuantity })),
    });
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch received successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent(error.message || 'Failed to receive dispatch')}`);
  }
};

export const cancelDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await cancelStoreDispatchUseCase.execute(req.params.dispatchId, req.body.reason || undefined);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch cancelled successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent(error.message || 'Failed to cancel dispatch')}`);
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
     FROM "inventoryLevel" il`,
  );

  return {
    totalProducts: parseInt(result?.totalProducts || '0'),
    inStock: parseInt(result?.inStock || '0'),
    lowStock: parseInt(result?.lowStock || '0'),
    outOfStock: parseInt(result?.outOfStock || '0'),
  };
}
