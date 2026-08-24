/**
 * Warehouse Customer Router
 * Public store locator routes for customers
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as warehouseController from '../controllers/warehouseCustomerController';

const router = express.Router();

// Store Locator Routes (Public)
router.get('/warehouse/nearest', asyncHandler(warehouseController.findNearestStores));
router.get('/warehouse/city/:city', asyncHandler(warehouseController.getStoresByCity));
router.get('/warehouse/country/:country', asyncHandler(warehouseController.getStoresByCountry));
router.get('/warehouse/:id/availability/:productId', asyncHandler(warehouseController.checkStoreAvailability));
router.get('/warehouse/:id', asyncHandler(warehouseController.getStoreById));

export const warehouseCustomerRouter = router;
