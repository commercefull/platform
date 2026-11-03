/**
 * Inventory Controller
 *
 * Handles HTTP requests for inventory management.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';

import type { PickupLocationPort } from '../../application/ports/PickupLocationPort';
import {
  pickupLocationAdapter,
  adjustStockUseCase,
  reserveLocationStockUseCase,
  releaseLocationReservationUseCase,
  manageInventoryLocationsUseCase,
} from '../../application/wired';
import { respond, respondError, respondWithPagination } from './inventoryRespond';

// Ports
const pickupLocationPort: PickupLocationPort = pickupLocationAdapter;

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
// Inventory Location Controllers
// ============================================================================

/**
 * Get inventory location by ID
 */
export const getInventoryLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const inventoryLocationId = (req.params.inventoryLocationId || req.params.inventoryId) as string;
  // Try store location first
  const storeLoc = await pickupLocationPort.findById(inventoryLocationId);
  if (storeLoc) {
    respond(res, { ...storeLoc, id: storeLoc.id });
    return;
  }

  const location = await manageInventoryLocationsUseCase.findLocationById(inventoryLocationId);

  if (!location) {
    respondError(res, 'Inventory location not found', 404);
    return;
  }

  respond(res, location);
};

/**
 * List inventory locations with filtering and pagination
 */
export const listInventoryLocations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === undefined;

  // Get store pickup locations
  const storeLocations = await pickupLocationPort.findAll();
  const storeData = storeLocations
    .filter(loc => includeInactive || loc.isActive !== false)
    .map(loc => ({ ...loc, id: loc.id, isActive: loc.isActive ?? true }));

  // Get inventory locations from the inventoryLocation table
  const inventoryLocations = await manageInventoryLocationsUseCase.findLocations(undefined, limit, offset);
  const inventoryData = inventoryLocations
    .filter(loc => includeInactive || loc.status === 'available')
    .map(loc => ({ ...loc, isActive: loc.status === 'available' }));

  // Merge both sources
  const data = [...storeData, ...inventoryData];
  respondWithPagination(res, data, limit, offset);
};

/**
 * Create a new inventory location
 */
export const createInventoryLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  // Support creating store locations (name/type/address...)
  const body = req.body as CreateLocationBody;
  const { name, address, address1, city, country } = body;
  if (name && (address || address1) && city && country) {
    const saved = await pickupLocationPort.create({
      storeId: body.storeId ?? null,
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
    respond(res, { ...saved, id: saved.id }, 201);
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

  const location = await manageInventoryLocationsUseCase.createLocation({
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
};

/**
 * Update an inventory location
 */
export const updateInventoryLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { inventoryLocationId } = req.params;
  const body = req.body as UpdateLocationBody;
  const { name, isActive, address, address1, city, state, country, postalCode } = body;

  // Try update store location if it exists
  const existingStore = await pickupLocationPort.findById(inventoryLocationId);
  if (existingStore) {
    const updated = await pickupLocationPort.update(inventoryLocationId, {
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
    respond(res, { ...updated, id: updated?.id });
    return;
  }

  const { quantity, reservedQuantity, minimumStockLevel, maximumStockLevel, status } = body;

  const location = await manageInventoryLocationsUseCase.updateLocation(inventoryLocationId, {
    quantity,
    reservedQuantity,
    minimumStockLevel,
    maximumStockLevel,
    status,
  });

  respond(res, location);
};

/**
 * Delete an inventory location
 */
export const deleteInventoryLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { inventoryLocationId } = req.params;
  // Prefer soft-delete store locations
  const store = await pickupLocationPort.findById(inventoryLocationId);
  if (store) {
    await pickupLocationPort.delete(inventoryLocationId);
    respond(res, { message: 'Inventory location deleted successfully' });
    return;
  }
  const existing = await manageInventoryLocationsUseCase.findLocationById(inventoryLocationId);
  if (!existing) {
    respondError(res, 'Inventory location not found', 404);
    return;
  }
  await manageInventoryLocationsUseCase.deleteLocation(inventoryLocationId);
  respond(res, { message: 'Inventory location deleted successfully' });
};

// ============================================================================
// Stock Operations
// ============================================================================

/**
 * Adjust stock quantity (restock, adjustment, etc.)
 */
export const adjustStock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const inventoryLocationId = (req.params.inventoryLocationId || req.params.inventoryId) as string;
  const { quantityChange, reason, transactionTypeCode } = req.body as AdjustStockBody;

  if (quantityChange === undefined) {
    respondError(res, 'quantityChange is required', 400);
    return;
  }

  const result = await adjustStockUseCase.execute({
    inventoryLocationId,
    adjustmentType: quantityChange >= 0 ? 'increment' : 'decrement',
    quantity: Math.abs(quantityChange),
    reason: reason || 'manual',
    transactionTypeCode,
  });
  respond(res, result.location);
};

/**
 * Reserve stock for an order or basket
 */
export const reserveStock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const inventoryLocationId = (req.params.inventoryLocationId || req.params.inventoryId) as string;
  const { quantity, orderId, basketId } = req.body as ReserveStockBody;

  const updatedLocation = await reserveLocationStockUseCase.execute({
    inventoryLocationId,
    quantity,
    orderId,
    basketId,
  });
  respond(res, updatedLocation);
};

/**
 * Release reserved stock
 */
export const releaseReservation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { inventoryLocationId } = req.params;
  const { quantity } = req.body as ReleaseReservationBody;

  const updatedLocation = await releaseLocationReservationUseCase.execute(inventoryLocationId, quantity);
  respond(res, updatedLocation);
};

// ============================================================================
// Availability & Low Stock
// ============================================================================

/**
 * Check product availability
 */
export const checkAvailability = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { sku } = req.params;
  const quantity = parseInt(req.query.quantity as string) || 1;

  const location = await manageInventoryLocationsUseCase.findLocationBySku(sku);

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
};

/**
 * Get low stock items
 */
export const getLowStock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const locations = await manageInventoryLocationsUseCase.findLowStockLocations();
  respond(res, locations);
};

/**
 * Get out of stock items
 */
export const getOutOfStock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const locations = await manageInventoryLocationsUseCase.findOutOfStockLocations();
  respond(res, locations);
};

// ============================================================================
// Transaction History
// ============================================================================

/**
 * Get transaction history for a product
 */
export const getTransactionHistory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const transactions = await manageInventoryLocationsUseCase.findTransactionsByProductId(productId, limit);
  respond(res, transactions);
};

/**
 * Get transaction types
 */
export const getTransactionTypes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const types = await manageInventoryLocationsUseCase.findAllTransactionTypes();
  respond(res, types);
};

// ============================================================================
// Product Availability (by productId)
// ============================================================================

export const checkProductAvailability = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const variantId = req.query.variantId as string | undefined;
  const quantity = parseInt(req.query.quantity as string) || 1;

  const result = await manageInventoryLocationsUseCase.checkProductAvailability(productId, variantId, quantity);
  respond(res, result);
};

// Re-exported from inventoryOpsControllers so existing router imports stay valid.
export {
  allocateFromPool,
  confirmReservation,
  createInventoryItem,
  createInventoryPool,
  getInventoryItem,
  listInventoryItems,
  setLowStockThreshold,
  transferBetweenStores,
  transferStock,
} from './inventoryOpsControllers';
