/**
 * Warehouse Customer Router
 * Public store locator routes for customers
 */

import express from 'express';
import * as warehouseController from './controllers/warehouseCustomerController';

const router = express.Router();

// Store Locator Routes (Public)
router.get('/warehouse/nearest', warehouseController.findNearestStores);
router.get('/warehouse/city/:city', warehouseController.getStoresByCity);
router.get('/warehouse/country/:country', warehouseController.getStoresByCountry);
router.get('/warehouse/:id/availability/:productId', warehouseController.checkStoreAvailability);
router.get('/warehouse/:id', warehouseController.getStoreById);

export const warehouseCustomerRouter = router;
