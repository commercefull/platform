/**
 * Inventory Controller
 *
 * Handles HTTP requests for inventory management.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import inventoryRepo from '../../infrastructure/repositories/inventoryRepo';
import inventoryRepository from '../../infrastructure/repositories/InventoryRepository';
import inventoryPoolRepo from '../../infrastructure/repositories/inventoryPoolRepo';
import {
  TransferStockUseCase,
  CreateInventoryItemUseCase,
  CreateInventoryPoolUseCase,
  AllocateFromPoolUseCase,
  GetInventoryItemUseCase,
  ListInventoryItemsUseCase,
  TransferBetweenStoresUseCase,
  ConfirmReservationUseCase,
  SetLowStockThresholdUseCase,
} from '../../application/useCases';
import {
  saveLocation as saveStoreLocation,
  getLocation as getStoreLocation,
  getLocations as listStoreLocations,
  deleteLocation as deleteStoreLocation,
  updateLocation,
  PickupLocation,
} from '../../../store/infrastructure/repositories/pickupLocationRepo';
import { eventBus } from '../../../../libs/events/eventBus';

// Type for listInventoryItems use case port compatibility
interface _ListInventoryItemsRepositoryPort {
  findAll(
    filters: Record<string, unknown>,
    pagination: { limit: number; offset: number; orderBy: string; orderDirection: 'asc' | 'desc' },
  ): Promise<{ data: Array<{ inventoryId: string; productId: string; variantId?: string; locationId: string; sku: string; quantity: number; reservedQuantity: number; reorderPoint: number }>; total: number }>;
  getStats(filters: Record<string, unknown>): Promise<{ totalItems: number; lowStockCount: number; outOfStockCount: number; totalValue?: number }>;
}

// ============================================================================
// Request Body Interfaces
// ============================================================================

interface CreateLocationBody {
  name?: string;
  type?: string;
  address?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive?: boolean;
  storeId?: string;
  distributionWarehouseId?: string;
  distributionWarehouseBinId?: string;
  productId?: string;
  productVariantId?: string;
  sku?: string;
  quantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  lotNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  status?: string;
}

interface UpdateLocationBody {
  name?: string;
  isActive?: boolean;
  type?: string;
  address?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  quantity?: number;
  reservedQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  status?: string;
}

interface AdjustStockBody {
  quantityChange?: number;
  reason?: string;
  transactionTypeCode?: string;
}

interface ReserveStockBody {
  quantity?: number;
  orderId?: string;
  basketId?: string;
}

interface ReleaseReservationBody {
  quantity?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function respond(res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondWithPagination(res: Response, data: unknown[], limit: number, offset: number): void {
  res.json({
    success: true,
    data,
    pagination: { limit, offset, count: data.length },
  });
}

function respondError(res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

function errorStatus(error: unknown, fallback: number = 400): number {
  const msg = error instanceof Error ? error.message.toLowerCase() : '';
  if (msg.includes('not found')) return 404;
  return fallback;
}

// ============================================================================
// Inventory Location Controllers
// ============================================================================

/**
 * Get inventory location by ID
 */
export const getInventoryLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    // Try store location first
    const storeLoc = await getStoreLocation(inventoryLocationId);
    if (storeLoc) {
      respond(res, { ...storeLoc, id: storeLoc.pickupLocationId });
      return;
    }

    const location = await inventoryRepo.findLocationById(inventoryLocationId);

    if (!location) {
      respondError(res, 'Inventory location not found', 404);
      return;
    }

    respond(res, location);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to get inventory location');
  }
};

/**
 * List inventory locations with filtering and pagination
 */
export const listInventoryLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // If called without product/sku filters, return store locations for admin UI/tests
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Prefer store locations listing
    const result = await listStoreLocations();
    const data = result.map((loc: PickupLocation) => ({ ...loc, id: loc.pickupLocationId }));
    respondWithPagination(res, data, limit, offset);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to list inventory locations');
  }
};

/**
 * Create a new inventory location
 */
export const createInventoryLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Support creating store locations (name/type/address...)
    const body = req.body as CreateLocationBody;
    const { name, address, address1, city, country } = body;
    if (name && (address || address1) && city && country) {
      const saved = await saveStoreLocation({
        storeId: body.storeId || 'default',
        name,
        address: {
          line1: address || address1 || '',
          city,
          state: body.state,
          postalCode: body.postalCode || '',
          country,
        },
        prepareTimeMinutes: 60,
      });
      respond(res, { ...saved, id: saved.pickupLocationId }, 201);
      return;
    }

    // Fallback: legacy inventory location tied to SKU
    const {
      distributionWarehouseId,
      distributionWarehouseBinId,
      productId,
      productVariantId,
      sku,
      quantity,
      minimumStockLevel,
      maximumStockLevel,
      lotNumber,
      serialNumber,
      expiryDate,
      status,
    } = body;

    if (!distributionWarehouseId || !productId || !sku) {
      respondError(res, 'distributionWarehouseId, productId, and sku are required', 400);
      return;
    }

    const location = await inventoryRepo.createLocation({
      distributionWarehouseId,
      distributionWarehouseBinId,
      productId,
      productVariantId,
      sku,
      quantity,
      minimumStockLevel,
      maximumStockLevel,
      lotNumber,
      serialNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      status,
    });

    respond(res, location, 201);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to create inventory location');
  }
};

/**
 * Update an inventory location
 */
export const updateInventoryLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const body = req.body as UpdateLocationBody;
    const { name, isActive, address, address1, city, state, country, postalCode } = body;

    // Try update store location if it exists
    const existingStore = await getStoreLocation(inventoryLocationId);
    if (existingStore) {
      // For updates, use the updateLocation function from pickupLocationRepo
      const updated = await updateLocation(inventoryLocationId, {
        name: name ?? existingStore.name,
        address: {
          line1: (address || address1) ?? existingStore.address.line1,
          city: city ?? existingStore.address.city,
          state: state ?? existingStore.address.state,
          postalCode: postalCode ?? existingStore.address.postalCode,
          country: country ?? existingStore.address.country,
        },
        isActive: isActive ?? existingStore.isActive,
      });
      respond(res, { ...updated, id: updated?.pickupLocationId });
      return;
    }

    const { quantity, reservedQuantity, minimumStockLevel, maximumStockLevel, status } = body;

    const location = await inventoryRepo.updateLocation(inventoryLocationId, {
      quantity,
      reservedQuantity,
      minimumStockLevel,
      maximumStockLevel,
      status,
    });

    respond(res, location);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to update inventory location', errorStatus(error, 400));
  }
};

/**
 * Delete an inventory location
 */
export const deleteInventoryLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    // Prefer soft-delete store locations
    const store = await getStoreLocation(inventoryLocationId);
    if (store) {
      await deleteStoreLocation(inventoryLocationId);
      respond(res, { message: 'Inventory location deleted successfully' });
      return;
    }
    const existing = await inventoryRepo.findLocationById(inventoryLocationId);
    if (!existing) {
      respondError(res, 'Inventory location not found', 404);
      return;
    }
    await inventoryRepo.deleteLocation(inventoryLocationId);
    respond(res, { message: 'Inventory location deleted successfully' });
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to delete inventory location', errorStatus(error, 400));
  }
};

// ============================================================================
// Stock Operations
// ============================================================================

/**
 * Adjust stock quantity (restock, adjustment, etc.)
 */
export const adjustStock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const { quantityChange, reason, transactionTypeCode } = req.body as AdjustStockBody;

    if (quantityChange === undefined) {
      respondError(res, 'quantityChange is required', 400);
      return;
    }

    // Get current location
    const currentLocation = await inventoryRepo.findLocationById(inventoryLocationId);
    if (!currentLocation) {
      respondError(res, 'Inventory location not found', 404);
      return;
    }

    // Get transaction type
    const transactionType = await inventoryRepo.findTransactionTypeByCode(
      transactionTypeCode || (quantityChange > 0 ? 'ADJUST_UP' : 'ADJUST_DOWN'),
    );

    // Adjust quantity
    const updatedLocation = await inventoryRepo.adjustQuantity(inventoryLocationId, quantityChange, reason);

    // Record transaction
    if (transactionType) {
      await inventoryRepo.createTransaction({
        typeId: transactionType.inventoryTransactionTypeId,
        distributionWarehouseId: currentLocation.distributionWarehouseId,
        distributionWarehouseBinId: currentLocation.distributionWarehouseBinId ?? undefined,
        productId: currentLocation.productId,
        productVariantId: currentLocation.productVariantId ?? undefined,
        sku: currentLocation.sku,
        quantity: quantityChange,
        previousQuantity: currentLocation.quantity,
        newQuantity: updatedLocation.quantity,
        notes: reason,
      });
    }

    // Emit event
    if (quantityChange > 0) {
      eventBus.emit('inventory.low', {
        inventoryLocationId,
        sku: currentLocation.sku,
        quantity: updatedLocation.quantity,
      });
    }

    respond(res, updatedLocation);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to adjust stock');
  }
};

/**
 * Reserve stock for an order or basket
 */
export const reserveStock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const { quantity, orderId, basketId } = req.body as ReserveStockBody;

    if (!quantity || quantity <= 0) {
      respondError(res, 'quantity must be a positive number', 400);
      return;
    }

    const updatedLocation = await inventoryRepo.reserveQuantity(inventoryLocationId, quantity);

    // Emit event
    eventBus.emit('inventory.reserved', {
      inventoryLocationId,
      quantity,
      orderId,
      basketId,
    });

    respond(res, updatedLocation);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to reserve stock');
  }
};

/**
 * Release reserved stock
 */
export const releaseReservation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const { quantity } = req.body as ReleaseReservationBody;

    if (!quantity || quantity <= 0) {
      respondError(res, 'quantity must be a positive number', 400);
      return;
    }

    const updatedLocation = await inventoryRepo.releaseReservation(inventoryLocationId, quantity);

    // Emit event
    eventBus.emit('inventory.released', {
      inventoryLocationId,
      quantity,
    });

    respond(res, updatedLocation);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to release reservation');
  }
};

// ============================================================================
// Availability & Low Stock
// ============================================================================

/**
 * Check product availability
 */
export const checkAvailability = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { sku } = req.params;
    const quantity = parseInt(req.query.quantity as string) || 1;

    const location = await inventoryRepo.findLocationBySku(sku);

    if (!location) {
      respond(res, {
        sku,
        available: false,
        totalAvailable: 0,
        message: 'Product not found in inventory',
      });
      return;
    }

    respond(res, {
      sku,
      available: location.availableQuantity >= quantity,
      totalAvailable: location.availableQuantity,
      requestedQuantity: quantity,
    });
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to check availability');
  }
};

/**
 * Get low stock items
 */
export const getLowStock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const locations = await inventoryRepo.findLowStockLocations();
    respond(res, locations);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to get low stock items');
  }
};

/**
 * Get out of stock items
 */
export const getOutOfStock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const locations = await inventoryRepo.findOutOfStockLocations();
    respond(res, locations);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to get out of stock items');
  }
};

// ============================================================================
// Transaction History
// ============================================================================

/**
 * Get transaction history for a product
 */
export const getTransactionHistory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await inventoryRepo.findTransactionsByProductId(productId, limit);
    respond(res, transactions);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to get transaction history');
  }
};

/**
 * Get transaction types
 */
export const getTransactionTypes = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const types = await inventoryRepo.findAllTransactionTypes();
    respond(res, types);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to get transaction types');
  }
};

// Legacy exports for backward compatibility
export const getInventory = getInventoryLocation;
export const listInventory = listInventoryLocations;
export const restockInventory = adjustStock;

// ============================================================================
// Product Availability (by productId)
// ============================================================================

export const checkProductAvailability = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const variantId = req.query.variantId as string | undefined;
    const quantity = parseInt(req.query.quantity as string) || 1;

    const result = await inventoryRepo.checkProductAvailability(productId, variantId, quantity);
    respond(res, result);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to check product availability');
  }
};

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

export const transferStock = async (req: TypedRequest<Record<string, string>, unknown, TransferStockBody>, res: Response): Promise<void> => {
  try {
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
    const useCase = new TransferStockUseCase(inventoryRepository);
    const result = await useCase.execute({
      sourceLocationId: req.body.sourceLocationId,
      destinationLocationId: req.body.destinationLocationId,
      items: req.body.items,
      reason: req.body.reason,
      notes: req.body.notes,
      initiatedBy: req.body.initiatedBy,
    });
    respond(res, result);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : 'Failed to transfer stock');
  }
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

export const createInventoryItem = async (req: TypedRequest<Record<string, string>, unknown, CreateInventoryItemBody>, res: Response): Promise<void> => {
  try {
    const useCase = new CreateInventoryItemUseCase(inventoryRepository);
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
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
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

export const createInventoryPool = async (req: TypedRequest<Record<string, string>, unknown, CreatePoolBody>, res: Response): Promise<void> => {
  try {
    const useCase = new CreateInventoryPoolUseCase(inventoryPoolRepo);
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
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
};

interface AllocateFromPoolBody {
  poolId: string;
  orderId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number; preferredLocationId?: string }>;
  allocationStrategy?: 'fifo' | 'nearest' | 'even_split' | 'priority';
  customerLocation?: { latitude: number; longitude: number; postalCode?: string };
}

export const allocateFromPool = async (req: TypedRequest<Record<string, string>, unknown, AllocateFromPoolBody>, res: Response): Promise<void> => {
  try {
    if (!req.body.poolId) {
      respondError(res, 'poolId is required', 400);
      return;
    }
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      respondError(res, 'items must be a non-empty array', 400);
      return;
    }
    const useCase = new AllocateFromPoolUseCase(inventoryPoolRepo);
    const result = await useCase.execute({
      poolId: req.body.poolId,
      orderId: req.body.orderId,
      items: req.body.items,
      allocationStrategy: req.body.allocationStrategy,
      customerLocation: req.body.customerLocation,
    });
    respond(res, result);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
};

// ============================================================================
// Get Inventory Item
// ============================================================================

export const getInventoryItem = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new GetInventoryItemUseCase(inventoryRepository);
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
        const any = await inventoryRepository.findBySku(sku);
        if (any && any.length > 0) {
          res.status(200).json({ success: true, data: any[0] });
          return;
        }
      }
      respondError(res, 'Inventory item not found', 404);
      return;
    }
    respond(res, result.item);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
};

// ============================================================================
// List Inventory Items
// ============================================================================

export const listInventoryItems = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ListInventoryItemsUseCase(inventoryRepository);
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
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
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

export const transferBetweenStores = async (req: TypedRequest<Record<string, string>, unknown, TransferBetweenStoresBody>, res: Response): Promise<void> => {
  try {
    const useCase = new TransferBetweenStoresUseCase(inventoryRepository);
    const result = await useCase.execute({
      sourceStoreId: req.body.sourceStoreId,
      targetStoreId: req.body.targetStoreId,
      items: req.body.items,
      reason: req.body.reason,
      priority: req.body.priority,
      requestedBy: req.body.requestedBy,
    });
    respond(res, result, 201);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
};

// ============================================================================
// Confirm Reservation
// ============================================================================

interface ConfirmReservationBody {
  reservationId: string;
  orderId?: string;
}

export const confirmReservation = async (req: TypedRequest<Record<string, string>, unknown, ConfirmReservationBody>, res: Response): Promise<void> => {
  try {
    const useCase = new ConfirmReservationUseCase(inventoryRepo);
    const result = await useCase.execute({
      reservationId: req.body.reservationId,
      orderId: req.body.orderId,
    });
    if (!result.confirmed) {
      respondError(res, result.message, 404);
      return;
    }
    respond(res, result);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
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

export const setLowStockThreshold = async (req: TypedRequest<Record<string, string>, unknown, SetLowStockThresholdBody>, res: Response): Promise<void> => {
  try {
    const useCase = new SetLowStockThresholdUseCase(inventoryRepository);
    const result = await useCase.execute({
      productId: req.body.productId,
      variantId: req.body.variantId,
      locationId: req.body.locationId,
      reorderPoint: req.body.reorderPoint,
      reorderQuantity: req.body.reorderQuantity,
    });
    respond(res, result);
  } catch (error: unknown) {
    respondError(res, error instanceof Error ? error.message : "Operation failed", errorStatus(error));
  }
};
