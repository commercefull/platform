/**
 * Inventory Business Router
 *
 * Routes for inventory management (merchant/admin access).
 */

import express from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();
router.use(isMerchantLoggedIn);

// ============================================================================
// Inventory Location Routes
// ============================================================================

router.get('/inventory/locations', inventoryController.listInventoryLocations);
router.get('/inventory/locations/low-stock', inventoryController.getLowStock);
router.get('/inventory/locations/out-of-stock', inventoryController.getOutOfStock);
router.get('/inventory/locations/:inventoryLocationId', inventoryController.getInventoryLocation);
router.post('/inventory/locations', inventoryController.createInventoryLocation);
router.put('/inventory/locations/:inventoryLocationId', inventoryController.updateInventoryLocation);
router.delete('/inventory/locations/:inventoryLocationId', inventoryController.deleteInventoryLocation);

// ============================================================================
// Stock Operations
// ============================================================================

router.post('/inventory/locations/:inventoryLocationId/adjust', inventoryController.adjustStock);
router.post('/inventory/locations/:inventoryLocationId/reserve', inventoryController.reserveStock);
router.post('/inventory/locations/:inventoryLocationId/release', inventoryController.releaseReservation);

// ============================================================================
// Transaction History
// ============================================================================

router.get('/inventory/transactions/types', inventoryController.getTransactionTypes);
router.get('/inventory/transactions/product/:productId', inventoryController.getTransactionHistory);

// ============================================================================
// Legacy Routes (for backward compatibility)
// ============================================================================

router.get('/inventory', inventoryController.listInventory);
router.get('/inventory/low-stock', inventoryController.getLowStock);
router.get('/inventory/:inventoryId', inventoryController.getInventory);
router.post('/inventory/:inventoryId/restock', inventoryController.restockInventory);
router.post('/inventory/:inventoryId/adjust', inventoryController.adjustStock);
router.post('/inventory/:inventoryId/reserve', inventoryController.reserveStock);

export const inventoryBusinessRouter = router;
