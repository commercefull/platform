/**
 * Inventory Controller for Admin Hub
 * Manages stock levels, adjustments, and inventory locations
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import inventoryRepository from '../../../modules/inventory/infrastructure/repositories/InventoryRepository';
import storeDispatchRepository from '../../../modules/inventory/infrastructure/repositories/StoreDispatchRepository';
import StoreRepo from '../../../modules/store/infrastructure/repositories/StoreRepo';
import * as adminInventoryRepo from '../../../modules/inventory/infrastructure/repositories/adminInventoryRepo';
import { ListStoreDispatchesUseCase } from '../../../modules/inventory/application/useCases/ListStoreDispatches';
import { GetStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/GetStoreDispatch';
import { CreateStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/CreateStoreDispatch';
import { ApproveStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/ApproveStoreDispatch';
import { DispatchFromStoreUseCase } from '../../../modules/inventory/application/useCases/DispatchFromStore';
import { ReceiveStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/ReceiveStoreDispatch';
import { CancelStoreDispatchUseCase } from '../../../modules/inventory/application/useCases/CancelStoreDispatch';

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

    const inventory = await adminInventoryRepo.findInventoryLevels({
      search: search as string | undefined,
      stockStatus: stockStatus as string | undefined,
      locationId: locationId as string | undefined,
      limit,
      offset,
    });

    const total = await adminInventoryRepo.countInventoryLevels({
      search: search as string | undefined,
      stockStatus: stockStatus as string | undefined,
      locationId: locationId as string | undefined,
    });

    const stats = await adminInventoryRepo.getInventoryStats();
    const locations = await adminInventoryRepo.findAllLocations();
    const lowStockItems = await adminInventoryRepo.findLowStockItems(10);

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
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load inventory',
    });
  }
};

// ============================================================================
// Adjust Stock
// ============================================================================

export const adjustStock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { inventoryLevelId, adjustmentType, quantity, reason, notes } = body;
    const userId = req.user?.userId;

    if (!inventoryLevelId || quantity === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const inventoryLevel = await adminInventoryRepo.findInventoryLevelById(inventoryLevelId);

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

    await adminInventoryRepo.adjustStockLevel(
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to adjust stock' });
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

    const inventoryLevel = await adminInventoryRepo.findInventoryLevelById(inventoryLevelId);

    if (!inventoryLevel) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Inventory level not found',
      });
      return;
    }

    const transactions = await adminInventoryRepo.findTransactionsByLevelId(inventoryLevelId, limit, offset);
    const total = await adminInventoryRepo.countTransactionsByLevelId(inventoryLevelId);

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
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load inventory history',
    });
  }
};

// ============================================================================
// List Locations
// ============================================================================

export const listLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const locations = await adminInventoryRepo.findLocationsWithStats();

    adminRespond(req, res, 'inventory/locations', {
      pageName: 'Inventory Locations',
      locations,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load locations',
    });
  }
};

// ============================================================================
// Low Stock Report
// ============================================================================

export const lowStockReport = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const lowStockItems = await adminInventoryRepo.findLowStockReport();

    adminRespond(req, res, 'inventory/low-stock', {
      pageName: 'Low Stock Report',
      items: lowStockItems,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to generate report',
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
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load dispatches' });
  }
};

export const createDispatchForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stores = await StoreRepo.findActive();
    adminRespond(req, res, 'inventory/dispatches/create', { pageName: 'Create Dispatch', stores, formData: {} });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load dispatch form' });
  }
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
    logger.error('Error:', error);
    const stores = await StoreRepo.findActive().catch(() => []);
    adminRespond(req, res, 'inventory/dispatches/create', {
      pageName: 'Create Dispatch',
      stores,
      formData: req.body as RequestBody,
      error: (error as Error).message || 'Failed to create dispatch',
    });
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
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load dispatch' });
  }
};

export const approveDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await approveStoreDispatchUseCase.execute(req.params.dispatchId, req.user?.userId || 'admin');
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch approved successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent((error as Error).message || 'Failed to approve dispatch')}`);
  }
};

export const markDispatched = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await dispatchFromStoreUseCase.execute(req.params.dispatchId, req.user?.userId || 'admin');
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch marked as shipped`);
  } catch (error: unknown) {
    logger.error('Error:', error);
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
    logger.error('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent((error as Error).message || 'Failed to receive dispatch')}`);
  }
};

export const cancelDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await cancelStoreDispatchUseCase.execute(req.params.dispatchId, (req.body as RequestBody).reason || undefined);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?success=Dispatch cancelled successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.redirect(`/admin/dispatches/${req.params.dispatchId}?error=${encodeURIComponent((error as Error).message || 'Failed to cancel dispatch')}`);
  }
};
