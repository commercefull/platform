/**
 * Inventory Controller for Admin Hub
 * Manages stock levels, adjustments, and inventory locations
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import { ManageAdminInventoryUseCase } from '../../../modules/inventory/application/useCases/ManageAdminInventory';
import { FindActiveStoresUseCase } from '../../../modules/store/application/useCases/wired';
import {
  listStoreDispatchesUseCase,
  getStoreDispatchUseCase,
  createStoreDispatchUseCase,
  approveStoreDispatchUseCase,
  dispatchFromStoreUseCase,
  receiveStoreDispatchUseCase,
  cancelStoreDispatchUseCase,
} from '../../../modules/inventory/application/useCases/wired';

const manageAdminInventoryUseCase = new ManageAdminInventoryUseCase();
const findActiveStoresUseCase = new FindActiveStoresUseCase();

// ============================================================================
// List Inventory
// ============================================================================

export const listInventory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { search, stockStatus, locationId, page = '1' } = req.query;
  const limit = 50;
  const offset = (parseInt(page as string) - 1) * limit;

  const inventory = await manageAdminInventoryUseCase.findInventoryLevels({
    search: search as string | undefined,
    stockStatus: stockStatus as string | undefined,
    locationId: locationId as string | undefined,
    limit,
    offset,
  });

  const total = await manageAdminInventoryUseCase.countInventoryLevels({
    search: search as string | undefined,
    stockStatus: stockStatus as string | undefined,
    locationId: locationId as string | undefined,
  });

  const stats = await manageAdminInventoryUseCase.getInventoryStats();
  const locations = await manageAdminInventoryUseCase.findAllLocations();
  const lowStockItems = await manageAdminInventoryUseCase.findLowStockItems(10);

  adminRespond(req, res, 'inventory/index', {
    pageName: 'Inventory',
    inventory,
    stats,
    locations,
    lowStockItems,
    pagination: {
      total,
      limit,
      page: parseInt(page as string),
      pages: Math.ceil(total / limit),
    },
    filters: { search, stockStatus, locationId },
  });
  
};

// ============================================================================
// Adjust Stock
// ============================================================================

export const adjustStock = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { inventoryLevelId, adjustmentType, quantity, reason, notes } = body;
  const userId = req.user?.userId;

  if (!inventoryLevelId || quantity === undefined) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  const inventoryLevel = await manageAdminInventoryUseCase.findInventoryLevelById(inventoryLevelId);

  if (!inventoryLevel) {
    res.status(404).json({ success: false, message: 'Inventory level not found' });
    return;
  }

  let newQuantity: number;
  const adjustmentQty = parseInt(quantity);
  const currentQty = typeof inventoryLevel.quantity === 'string' ? parseInt(inventoryLevel.quantity) : inventoryLevel.quantity;

  switch (adjustmentType) {
    case 'add':
      newQuantity = currentQty + adjustmentQty;
      break;
    case 'remove':
      newQuantity = Math.max(0, currentQty - adjustmentQty);
      break;
    case 'set':
      newQuantity = adjustmentQty;
      break;
    default:
      res.status(400).json({ success: false, message: 'Invalid adjustment type' });
      return;
  }

  await manageAdminInventoryUseCase.adjustStockLevel(
    inventoryLevelId,
    newQuantity,
    currentQty,
    inventoryLevel.productId,
    inventoryLevel.locationId,
    adjustmentType,
    adjustmentQty,
    reason || 'manual_adjustment',
    notes || null,
    userId || '',
  );

  res.json({ success: true, message: 'Stock adjusted successfully', newQuantity });
  
};

// ============================================================================
// View Inventory History
// ============================================================================

export const viewInventoryHistory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { inventoryLevelId } = req.params;
  const { page = '1' } = req.query;
  const limit = 50;
  const offset = (parseInt(page as string) - 1) * limit;

  const inventoryLevel = await manageAdminInventoryUseCase.findInventoryLevelById(inventoryLevelId);

  if (!inventoryLevel) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Inventory level not found',
    });
    return;
  }

  const transactions = await manageAdminInventoryUseCase.findTransactionsByLevelId(inventoryLevelId, limit, offset);
  const total = await manageAdminInventoryUseCase.countTransactionsByLevelId(inventoryLevelId);

  adminRespond(req, res, 'inventory/history', {
    pageName: `Inventory History: ${inventoryLevel.productName}`,
    inventoryLevel,
    transactions,
    pagination: {
      total,
      limit,
      page: parseInt(page as string),
      pages: Math.ceil(total / limit),
    },
  });
  
};

// ============================================================================
// List Locations
// ============================================================================

export const listLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  const locations = await manageAdminInventoryUseCase.findLocationsWithStats();

  adminRespond(req, res, 'inventory/locations', {
    pageName: 'Inventory Locations',
    locations,
  });
  
};

// ============================================================================
// Low Stock Report
// ============================================================================

export const lowStockReport = async (req: TypedRequest, res: Response): Promise<void> => {
  const lowStockItems = await manageAdminInventoryUseCase.findLowStockReport();

  adminRespond(req, res, 'inventory/low-stock', {
    pageName: 'Low Stock Report',
    items: lowStockItems,
  });
  
};

export const listDispatches = async (req: TypedRequest, res: Response): Promise<void> => {
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
  const stores = await findActiveStoresUseCase.execute();
  adminRespond(req, res, 'inventory/dispatches/index', {
    pageName: 'Dispatches',
    dispatches: result.dispatches,
    stores,
    filters: req.query,
  });
  
};

export const createDispatchForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const stores = await findActiveStoresUseCase.execute();
  adminRespond(req, res, 'inventory/dispatches/create', { pageName: 'Create Dispatch', stores, formData: {} });
  
};

export const createDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const items = Array.isArray((req.body as RequestBody).items)
      ? (req.body as RequestBody).items
      : (req.body as RequestBody).productId
        ? [
            {
              productId: (req.body as RequestBody).productId,
              variantId: (req.body as RequestBody).variantId || undefined,
              quantity: parseInt((req.body as RequestBody).quantity || '0', 10),
              sku: (req.body as RequestBody).sku || undefined,
              productName: (req.body as RequestBody).productName || undefined,
            },
          ]
        : [];

    const dispatch = await createStoreDispatchUseCase.execute({
      fromStoreId: (req.body as RequestBody).fromStoreId,
      toStoreId: (req.body as RequestBody).toStoreId,
      items,
      notes: (req.body as RequestBody).notes || undefined,
      requestedBy: req.user?.userId || 'admin',
    });
    res.redirect(`/admin/dispatches/${dispatch.dispatchId}?success=Dispatch created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    const stores = await findActiveStoresUseCase.execute().catch(() => []);
    adminRespond(req, res, 'inventory/dispatches/create', {
      pageName: 'Create Dispatch',
      stores,
      formData: req.body as RequestBody,
      error: (error as Error).message || 'Failed to create dispatch',
    });
  }
};

export const viewDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  const dispatch = await getStoreDispatchUseCase.execute(req.params.dispatchId);
  if (!dispatch) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Dispatch not found' });
    return;
  }
  adminRespond(req, res, 'inventory/dispatches/view', { pageName: dispatch.dispatchNumber, dispatch });
  
};

export const approveDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await approveStoreDispatchUseCase.execute(req.params.dispatchId, req.user?.userId || 'admin');
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch approved successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent((error as Error).message || 'Failed to approve dispatch')}`);
  }
};

export const markDispatched = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await dispatchFromStoreUseCase.execute(req.params.dispatchId, req.user?.userId || 'admin');
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch marked as shipped`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent((error as Error).message || 'Failed to ship dispatch')}`);
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
      receivedBy: req.user?.userId || 'admin',
      notes: (req.body as RequestBody).notes || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: ((dispatch as any).items || []).map((item: { dispatchItemId: string; dispatchedQuantity: number; requestedQuantity: number }) => ({
        dispatchItemId: item.dispatchItemId,
        receivedQuantity: item.dispatchedQuantity || item.requestedQuantity,
      })),
    });
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch received successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent((error as Error).message || 'Failed to receive dispatch')}`);
  }
};

export const cancelDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await cancelStoreDispatchUseCase.execute(req.params.dispatchId, (req.body as RequestBody).reason || undefined);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch cancelled successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent((error as Error).message || 'Failed to cancel dispatch')}`);
  }
};
