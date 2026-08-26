/**
 * Inventory Business Router
 *
 * Routes for inventory management (merchant/admin access).
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as inventoryController from '../controllers/inventoryController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { storeDispatchRouter } from './storeDispatchRouter';

const router = express.Router();
router.use(isOrganizationLoggedIn);

// ============================================================================
// Inventory Location Routes
// ============================================================================

router.get('/inventory/locations', asyncHandler(inventoryController.listInventoryLocations));
router.get('/inventory/locations/low-stock', asyncHandler(inventoryController.getLowStock));
router.get('/inventory/locations/out-of-stock', asyncHandler(inventoryController.getOutOfStock));
router.get('/inventory/locations/:inventoryLocationId', asyncHandler(inventoryController.getInventoryLocation));
router.post('/inventory/locations', asyncHandler(inventoryController.createInventoryLocation));
router.put('/inventory/locations/:inventoryLocationId', asyncHandler(inventoryController.updateInventoryLocation));
router.delete('/inventory/locations/:inventoryLocationId', asyncHandler(inventoryController.deleteInventoryLocation));

// ============================================================================
// Stock Operations
// ============================================================================

router.post('/inventory/locations/:inventoryLocationId/adjust', asyncHandler(inventoryController.adjustStock));
router.post('/inventory/locations/:inventoryLocationId/reserve', asyncHandler(inventoryController.reserveStock));
router.post('/inventory/locations/:inventoryLocationId/release', asyncHandler(inventoryController.releaseReservation));

// ============================================================================
// Transaction History
// ============================================================================

router.get('/inventory/transactions/types', asyncHandler(inventoryController.getTransactionTypes));
router.get('/inventory/transactions/product/:productId', asyncHandler(inventoryController.getTransactionHistory));

// ============================================================================
// Stock Transfer
// ============================================================================

router.post('/inventory/transfer', asyncHandler(inventoryController.transferStock));

// ============================================================================
// Inventory Item Management
// ============================================================================

router.post('/inventory/items', asyncHandler(inventoryController.createInventoryItem));

// ============================================================================
// Inventory Pool Operations
// ============================================================================

router.post('/inventory/pools', asyncHandler(inventoryController.createInventoryPool));
router.post('/inventory/pools/allocate', asyncHandler(inventoryController.allocateFromPool));

// ============================================================================
// Inventory Item Queries & Store Transfers
// ============================================================================

router.get('/inventory/items', asyncHandler(inventoryController.listInventoryItems));
router.get('/inventory/items/lookup', asyncHandler(inventoryController.getInventoryItem));
router.post('/inventory/transfer-between-stores', asyncHandler(inventoryController.transferBetweenStores));

// ============================================================================
// Reservation Management
// ============================================================================

router.post('/inventory/reservations/:reservationId/confirm', asyncHandler(inventoryController.confirmReservation));

// ============================================================================
// Low Stock Threshold
// ============================================================================

router.put('/inventory/products/:productId/threshold', asyncHandler(inventoryController.setLowStockThreshold));

// ============================================================================
// Legacy Routes (for backward compatibility)
// ============================================================================

router.get('/inventory', asyncHandler(inventoryController.listInventoryLocations));
router.get('/inventory/low-stock', asyncHandler(inventoryController.getLowStock));
router.get('/inventory/:inventoryId', asyncHandler(inventoryController.getInventoryLocation));
router.post('/inventory/:inventoryId/restock', asyncHandler(inventoryController.adjustStock));
router.post('/inventory/:inventoryId/adjust', asyncHandler(inventoryController.adjustStock));
router.post('/inventory/:inventoryId/reserve', asyncHandler(inventoryController.reserveStock));
router.use(storeDispatchRouter);

export const inventoryBusinessRouter = router;
