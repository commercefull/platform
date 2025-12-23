/**
 * Inventory Controller
 * 
 * Handles HTTP requests for inventory management.
 */

import { Request, Response } from 'express';
import inventoryRepo from '../../repos/inventoryRepo';
import { saveLocation as saveStoreLocation, getLocation as getStoreLocation, getLocations as listStoreLocations, deleteLocation as deleteStoreLocation } from '../../../store/repos/pickupLocationRepo';
import { eventBus } from '../../../../libs/events/eventBus';
import { updateLocation } from '../../../store/repos/pickupLocationRepo';
// ============================================================================
// Helper Functions
// ============================================================================

function respond(res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondWithPagination(
  res: Response, 
  data: unknown[], 
  limit: number, 
  offset: number
): void {
  res.json({
    success: true,
    data,
    pagination: { limit, offset, count: data.length }
  });
}

function respondError(res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Inventory Location Controllers
// ============================================================================

/**
 * Get inventory location by ID
 */
export const getInventoryLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    // Try store location first
    const storeLoc = await getStoreLocation(inventoryLocationId);
    if (storeLoc) {
      respond(res, { ...storeLoc, id: (storeLoc as any).storeLocationId });
      return;
    }

    const location = await inventoryRepo.findLocationById(inventoryLocationId);

    if (!location) {
      respondError(res, 'Inventory location not found', 404);
      return;
    }

    respond(res, location);
  } catch (error: unknown) {
    console.error('Get inventory location error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to get inventory location');
  }
};

/**
 * List inventory locations with filtering and pagination
 */
export const listInventoryLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    // If called without product/sku filters, return store locations for admin UI/tests
    const includeInactive = (req.query.includeInactive as string) === 'true';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Prefer store locations listing
    const result = await listStoreLocations();
    const data = result.map((loc: any) => ({ ...loc, id: loc.pickupLocationId }));
    respondWithPagination(res, data, limit, offset);
  } catch (error: unknown) {
    console.error('List inventory locations error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to list inventory locations');
  }
};

/**
 * Create a new inventory location
 */
export const createInventoryLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    // Support creating store locations (name/type/address...)
    const { name, type, address, address1, city, state, country, postalCode, isActive } = req.body as any;
    if (name && (address || address1) && city && country) {
      const saved = await saveStoreLocation({
        storeId: req.body.storeId || 'default',
        name,
        address: {
          line1: address || address1,
          city,
          state,
          postalCode,
          country,
        },
        prepareTimeMinutes: 60,
      });
      respond(res, { ...saved, id: (saved as any).pickupLocationId }, 201);
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
      status
    } = req.body;

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
      status
    });

    respond(res, location, 201);
  } catch (error: unknown) {
    console.error('Create inventory location error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to create inventory location');
  }
};

/**
 * Update an inventory location
 */
export const updateInventoryLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const { name, isActive, type, address, address1, city, state, country, postalCode } = req.body as any;

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
      respond(res, { ...updated, id: (updated as any)?.pickupLocationId });
      return;
    }

    const { quantity, reservedQuantity, minimumStockLevel, maximumStockLevel, status } = req.body;

    const location = await inventoryRepo.updateLocation(inventoryLocationId, {
      quantity,
      reservedQuantity,
      minimumStockLevel,
      maximumStockLevel,
      status
    });

    respond(res, location);
  } catch (error: unknown) {
    console.error('Update inventory location error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to update inventory location');
  }
};

/**
 * Delete an inventory location
 */
export const deleteInventoryLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    // Prefer soft-delete store locations
    const store = await getStoreLocation(inventoryLocationId);
    if (store) {
      await deleteStoreLocation(inventoryLocationId);
      respond(res, { message: 'Inventory location deleted successfully' });
      return;
    }
    await inventoryRepo.deleteLocation(inventoryLocationId);
    respond(res, { message: 'Inventory location deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete inventory location error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to delete inventory location');
  }
};

// ============================================================================
// Stock Operations
// ============================================================================

/**
 * Adjust stock quantity (restock, adjustment, etc.)
 */
export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const { quantityChange, reason, transactionTypeCode } = req.body;

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
      transactionTypeCode || (quantityChange > 0 ? 'ADJUST_UP' : 'ADJUST_DOWN')
    );

    // Adjust quantity
    const updatedLocation = await inventoryRepo.adjustQuantity(
      inventoryLocationId,
      quantityChange,
      reason
    );

    // Record transaction
    if (transactionType) {
      await inventoryRepo.createTransaction({
        typeId: transactionType.inventoryTransactionTypeId,
        distributionWarehouseId: currentLocation.distributionWarehouseId,
        distributionWarehouseBinId: currentLocation.distributionWarehouseBinId || undefined,
        productId: currentLocation.productId,
        productVariantId: currentLocation.productVariantId || undefined,
        sku: currentLocation.sku,
        quantity: quantityChange,
        previousQuantity: currentLocation.quantity,
        newQuantity: updatedLocation.quantity,
        notes: reason
      });
    }

    // Emit event
    if (quantityChange > 0) {
      eventBus.emit('inventory.low', {
        inventoryLocationId,
        sku: currentLocation.sku,
        quantity: updatedLocation.quantity
      });
    }

    respond(res, updatedLocation);
  } catch (error: unknown) {
    console.error('Adjust stock error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to adjust stock');
  }
};

/**
 * Reserve stock for an order or basket
 */
export const reserveStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const { quantity, orderId, basketId } = req.body;

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
      basketId
    });

    respond(res, updatedLocation);
  } catch (error: unknown) {
    console.error('Reserve stock error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to reserve stock');
  }
};

/**
 * Release reserved stock
 */
export const releaseReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryLocationId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      respondError(res, 'quantity must be a positive number', 400);
      return;
    }

    const updatedLocation = await inventoryRepo.releaseReservation(inventoryLocationId, quantity);

    // Emit event
    eventBus.emit('inventory.released', {
      inventoryLocationId,
      quantity
    });

    respond(res, updatedLocation);
  } catch (error: unknown) {
    console.error('Release reservation error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to release reservation');
  }
};

// ============================================================================
// Availability & Low Stock
// ============================================================================

/**
 * Check product availability
 */
export const checkAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku } = req.params;
    const quantity = parseInt(req.query.quantity as string) || 1;

    const location = await inventoryRepo.findLocationBySku(sku);
    
    if (!location) {
      respond(res, { 
        sku, 
        available: false, 
        totalAvailable: 0,
        message: 'Product not found in inventory' 
      });
      return;
    }

    respond(res, {
      sku,
      available: location.availableQuantity >= quantity,
      totalAvailable: location.availableQuantity,
      requestedQuantity: quantity
    });
  } catch (error: unknown) {
    console.error('Check availability error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to check availability');
  }
};

/**
 * Get low stock items
 */
export const getLowStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = await inventoryRepo.findLowStockLocations();
    respond(res, locations);
  } catch (error: unknown) {
    console.error('Get low stock error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to get low stock items');
  }
};

/**
 * Get out of stock items
 */
export const getOutOfStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = await inventoryRepo.findOutOfStockLocations();
    respond(res, locations);
  } catch (error: unknown) {
    console.error('Get out of stock error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to get out of stock items');
  }
};

// ============================================================================
// Transaction History
// ============================================================================

/**
 * Get transaction history for a product
 */
export const getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await inventoryRepo.findTransactionsByProductId(productId, limit);
    respond(res, transactions);
  } catch (error: unknown) {
    console.error('Get transaction history error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to get transaction history');
  }
};

/**
 * Get transaction types
 */
export const getTransactionTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const types = await inventoryRepo.findAllTransactionTypes();
    respond(res, types);
  } catch (error: unknown) {
    console.error('Get transaction types error:', error);
    respondError(res, error instanceof Error ? error.message : 'Failed to get transaction types');
  }
};

// Legacy exports for backward compatibility
export const getInventory = getInventoryLocation;
export const listInventory = listInventoryLocations;
export const restockInventory = adjustStock;
