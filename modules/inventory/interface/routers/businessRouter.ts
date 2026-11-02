/**
 * Inventory Business Router
 *
 * Routes for inventory management (merchant/admin access).
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  adjustStock,
  allocateFromPool,
  confirmReservation,
  createInventoryItem,
  createInventoryLocation,
  createInventoryPool,
  deleteInventoryLocation,
  getInventoryItem,
  getInventoryLocation,
  getLowStock,
  getOutOfStock,
  getTransactionHistory,
  getTransactionTypes,
  listInventoryItems,
  listInventoryLocations,
  releaseReservation,
  reserveStock,
  setLowStockThreshold,
  transferBetweenStores,
  transferStock,
  updateInventoryLocation,
} from '../controllers/inventoryController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { storeDispatchRouter } from './storeDispatchRouter';

const router = createHttpRouter();
router.use(isOrganizationLoggedIn);

// ============================================================================
// Inventory Location Routes
// ============================================================================

router.get('/inventory/locations', asyncHandler(listInventoryLocations));
router.get('/inventory/locations/low-stock', asyncHandler(getLowStock));
router.get('/inventory/locations/out-of-stock', asyncHandler(getOutOfStock));
router.get('/inventory/locations/:inventoryLocationId', asyncHandler(getInventoryLocation));
router.post('/inventory/locations', asyncHandler(createInventoryLocation));
router.put('/inventory/locations/:inventoryLocationId', asyncHandler(updateInventoryLocation));
router.delete('/inventory/locations/:inventoryLocationId', asyncHandler(deleteInventoryLocation));

// ============================================================================
// Stock Operations
// ============================================================================

router.post('/inventory/locations/:inventoryLocationId/adjust', asyncHandler(adjustStock));
router.post('/inventory/locations/:inventoryLocationId/reserve', asyncHandler(reserveStock));
router.post('/inventory/locations/:inventoryLocationId/release', asyncHandler(releaseReservation));

// ============================================================================
// Transaction History
// ============================================================================

router.get('/inventory/transactions/types', asyncHandler(getTransactionTypes));
router.get('/inventory/transactions/product/:productId', asyncHandler(getTransactionHistory));

// ============================================================================
// Stock Transfer
// ============================================================================

router.post('/inventory/transfer', asyncHandler(transferStock));

// ============================================================================
// Inventory Item Management
// ============================================================================

router.post('/inventory/items', asyncHandler(createInventoryItem));

// ============================================================================
// Inventory Pool Operations
// ============================================================================

router.post('/inventory/pools', asyncHandler(createInventoryPool));
router.post('/inventory/pools/allocate', asyncHandler(allocateFromPool));

// ============================================================================
// Inventory Item Queries & Store Transfers
// ============================================================================

router.get('/inventory/items', asyncHandler(listInventoryItems));
router.get('/inventory/items/lookup', asyncHandler(getInventoryItem));
router.post('/inventory/transfer-between-stores', asyncHandler(transferBetweenStores));

// ============================================================================
// Reservation Management
// ============================================================================

router.post('/inventory/reservations/:reservationId/confirm', asyncHandler(confirmReservation));

// ============================================================================
// Low Stock Threshold
// ============================================================================

router.put('/inventory/products/:productId/threshold', asyncHandler(setLowStockThreshold));

// ============================================================================
// Legacy Routes (for backward compatibility)
// ============================================================================

router.get('/inventory', asyncHandler(listInventoryLocations));
router.get('/inventory/low-stock', asyncHandler(getLowStock));
router.get('/inventory/:inventoryId', asyncHandler(getInventoryLocation));
router.post('/inventory/:inventoryId/restock', asyncHandler(adjustStock));
router.post('/inventory/:inventoryId/adjust', asyncHandler(adjustStock));
router.post('/inventory/:inventoryId/reserve', asyncHandler(reserveStock));
router.use(storeDispatchRouter);

export const inventoryBusinessRouter = router;
