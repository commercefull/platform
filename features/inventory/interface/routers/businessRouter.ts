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

router.get('/locations', inventoryController.listInventoryLocations);
router.get('/locations/low-stock', inventoryController.getLowStock);
router.get('/locations/out-of-stock', inventoryController.getOutOfStock);
router.get('/locations/:inventoryLocationId', inventoryController.getInventoryLocation);
router.post('/locations', inventoryController.createInventoryLocation);
router.put('/locations/:inventoryLocationId', inventoryController.updateInventoryLocation);
router.delete('/locations/:inventoryLocationId', inventoryController.deleteInventoryLocation);

// ============================================================================
// Stock Operations
// ============================================================================

router.post('/locations/:inventoryLocationId/adjust', inventoryController.adjustStock);
router.post('/locations/:inventoryLocationId/reserve', inventoryController.reserveStock);
router.post('/locations/:inventoryLocationId/release', inventoryController.releaseReservation);

// ============================================================================
// Transaction History
// ============================================================================

router.get('/transactions/types', inventoryController.getTransactionTypes);
router.get('/transactions/product/:productId', inventoryController.getTransactionHistory);

// ============================================================================
// Legacy Routes (for backward compatibility)
// ============================================================================

router.get('/', inventoryController.listInventory);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/:inventoryId', inventoryController.getInventory);
router.post('/:inventoryId/restock', inventoryController.restockInventory);
router.post('/:inventoryId/adjust', inventoryController.adjustStock);
router.post('/:inventoryId/reserve', inventoryController.reserveStock);

export const inventoryBusinessRouter = router;
