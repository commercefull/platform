/**
 * Warehouse Customer Router
 * Public store locator routes for customers
 */

import express from 'express';
import * as warehouseController from './controllers/warehouseCustomerController';

const router = express.Router();

// Store Locator Routes (Public)
router.get('/nearest', warehouseController.findNearestStores);
router.get('/city/:city', warehouseController.getStoresByCity);
router.get('/country/:country', warehouseController.getStoresByCountry);
router.get('/:id/availability/:productId', warehouseController.checkStoreAvailability);
router.get('/:id', warehouseController.getStoreById);

export const warehouseCustomerRouter = router;
