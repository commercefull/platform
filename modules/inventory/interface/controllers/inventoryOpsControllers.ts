/**
 * Inventory Operations Controllers
 *
 * Stock transfers, inventory items, pools, reservations, and thresholds.
 */

import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  transferStockUseCase,
  createInventoryItemUseCase,
  createInventoryPoolUseCase,
  allocateFromPoolUseCase,
  getInventoryItemUseCase,
  listInventoryItemsUseCase,
  transferBetweenStoresUseCase,
  confirmReservationUseCase,
  setLowStockThresholdUseCase,
} from '../../application/wired';
import { respond, respondError } from './inventoryRespond';

// ============================================================================
// Stock Transfer
// ============================================================================

interface TransferStockBody {
  sourceLocationId?: string;
  destinationLocationId?: string;
  items?: Array<{ productId: string; variantId?: string; sku?: string; quantity: number }>;
  reason?: string;
  notes?: string;
  initiatedBy?: string;
}

export const transferStock = async (
  req: HttpRequest<Record<string, string>, unknown, TransferStockBody>,
  res: HttpResponse,
): Promise<void> => {
  if (!req.body.sourceLocationId || !req.body.destinationLocationId || !req.body.items) {
    respondError(res, 'sourceLocationId, destinationLocationId, and items are required', 400);
    return;
  }
  if (req.body.sourceLocationId === req.body.destinationLocationId) {
    respondError(res, 'sourceLocationId and destinationLocationId cannot be the same', 400);
    return;
  }
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
    respondError(res, 'items must be a non-empty array', 400);
    return;
  }
  const useCase = transferStockUseCase;
  const result = await useCase.execute({
    sourceLocationId: req.body.sourceLocationId,
    destinationLocationId: req.body.destinationLocationId,
    items: req.body.items,
    reason: req.body.reason,
    notes: req.body.notes,
    initiatedBy: req.body.initiatedBy,
  });
  respond(res, result);
};

// ============================================================================
// Inventory Item Management
// ============================================================================

interface CreateInventoryItemBody {
  productId: string;
  variantId?: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  reservedQuantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  binLocation?: string;
  costPrice?: number;
  metadata?: Record<string, unknown>;
}

export const createInventoryItem = async (
  req: HttpRequest<Record<string, string>, unknown, CreateInventoryItemBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = createInventoryItemUseCase;
  const result = await useCase.execute({
    productId: req.body.productId,
    variantId: req.body.variantId,
    warehouseId: req.body.warehouseId,
    sku: req.body.sku,
    quantity: req.body.quantity,
    reservedQuantity: req.body.reservedQuantity,
    reorderPoint: req.body.reorderPoint,
    reorderQuantity: req.body.reorderQuantity,
    binLocation: req.body.binLocation,
    costPrice: req.body.costPrice,
    metadata: req.body.metadata,
  });
  respond(res, result, 201);
};

// ============================================================================
// Inventory Pool Operations
// ============================================================================

interface CreatePoolBody {
  ownerType: 'organization';
  ownerId: string;
  name: string;
  poolType: 'shared' | 'virtual' | 'aggregated';
  linkedInventoryIds?: string[];
  allocationStrategy?: 'fifo' | 'nearest' | 'even_split' | 'priority';
  reservationPolicy?: 'immediate' | 'deferred';
}

export const createInventoryPool = async (
  req: HttpRequest<Record<string, string>, unknown, CreatePoolBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = createInventoryPoolUseCase;
  const result = await useCase.execute({
    ownerType: req.body.ownerType,
    ownerId: req.body.ownerId,
    name: req.body.name,
    poolType: req.body.poolType,
    linkedInventoryIds: req.body.linkedInventoryIds,
    allocationStrategy: req.body.allocationStrategy,
    reservationPolicy: req.body.reservationPolicy,
  });
  respond(res, result, 201);
};

interface AllocateFromPoolBody {
  poolId: string;
  orderId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number; preferredLocationId?: string }>;
  allocationStrategy?: 'fifo' | 'nearest' | 'even_split' | 'priority';
  customerLocation?: { latitude: number; longitude: number; postalCode?: string };
}

export const allocateFromPool = async (
  req: HttpRequest<Record<string, string>, unknown, AllocateFromPoolBody>,
  res: HttpResponse,
): Promise<void> => {
  if (!req.body.poolId) {
    respondError(res, 'poolId is required', 400);
    return;
  }
  if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
    respondError(res, 'items must be a non-empty array', 400);
    return;
  }
  const useCase = allocateFromPoolUseCase;
  const result = await useCase.execute({
    poolId: req.body.poolId,
    orderId: req.body.orderId,
    items: req.body.items,
    allocationStrategy: req.body.allocationStrategy,
    customerLocation: req.body.customerLocation,
  });
  respond(res, result);
};

// ============================================================================
// Get Inventory Item
// ============================================================================

export const getInventoryItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = getInventoryItemUseCase;
  const result = await useCase.execute({
    inventoryItemId: req.query.inventoryItemId as string | undefined,
    sku: req.query.sku as string | undefined,
    productId: req.query.productId as string | undefined,
    variantId: req.query.variantId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
  });
  if (!result.found) {
    // Best-effort fallback: if SKU provided but not found for given warehouse, try any location
    const sku = req.query.sku as string | undefined;
    if (sku) {
      // Use repository directly to search any location
      const any = await getInventoryItemUseCase.findBySku(sku);
      if (any && any.length > 0) {
        jsonResponse(res, 200, { success: true, data: any[0] });
        return;
      }
    }
    respondError(res, 'Inventory item not found', 404);
    return;
  }
  respond(res, result.item);
};

// ============================================================================
// List Inventory Items
// ============================================================================

export const listInventoryItems = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = listInventoryItemsUseCase;
  const result = await useCase.execute({
    warehouseId: req.query.warehouseId as string | undefined,
    productId: req.query.productId as string | undefined,
    lowStockOnly: req.query.lowStockOnly === 'true',
    outOfStockOnly: req.query.outOfStockOnly === 'true',
    search: req.query.search as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    sortBy: req.query.sortBy as 'sku' | 'quantity' | 'updatedAt' | undefined,
    sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
  });
  respond(res, result);
};

// ============================================================================
// Transfer Between Stores
// ============================================================================

interface TransferBetweenStoresBody {
  sourceStoreId: string;
  targetStoreId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  reason?: string;
  priority?: 'normal' | 'urgent' | 'low';
  requestedBy?: string;
}

export const transferBetweenStores = async (
  req: HttpRequest<Record<string, string>, unknown, TransferBetweenStoresBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = transferBetweenStoresUseCase;
  const result = await useCase.execute({
    sourceStoreId: req.body.sourceStoreId,
    targetStoreId: req.body.targetStoreId,
    items: req.body.items,
    reason: req.body.reason,
    priority: req.body.priority,
    requestedBy: req.body.requestedBy,
  });
  respond(res, result, 201);
};

// ============================================================================
// Confirm Reservation
// ============================================================================

interface ConfirmReservationBody {
  reservationId: string;
  orderId?: string;
}

export const confirmReservation = async (
  req: HttpRequest<Record<string, string>, unknown, ConfirmReservationBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = confirmReservationUseCase;
  const result = await useCase.execute({
    reservationId: req.body.reservationId || req.params.reservationId,
    orderId: req.body.orderId,
  });
  if (!result.confirmed) {
    respondError(res, result.message, 404);
    return;
  }
  respond(res, result);
};

// ============================================================================
// Set Low Stock Threshold
// ============================================================================

interface SetLowStockThresholdBody {
  productId: string;
  variantId?: string;
  locationId: string;
  reorderPoint: number;
  reorderQuantity?: number;
}

export const setLowStockThreshold = async (
  req: HttpRequest<Record<string, string>, unknown, SetLowStockThresholdBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = setLowStockThresholdUseCase;
  const result = await useCase.execute({
    productId: req.body.productId,
    variantId: req.body.variantId,
    locationId: req.body.locationId,
    reorderPoint: req.body.reorderPoint,
    reorderQuantity: req.body.reorderQuantity,
  });
  respond(res, result);
};
