/**
 * Warehouse Customer Router
 * Public store locator routes for customers
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  checkStoreAvailability,
  findNearestStores,
  getStoreById,
  getStoresByCity,
  getStoresByCountry,
} from '../controllers/warehouseCustomerController';
const router = createHttpRouter();

// Store Locator Routes (Public)
router.get('/warehouse/nearest', asyncHandler(findNearestStores));
router.get('/warehouse/city/:city', asyncHandler(getStoresByCity));
router.get('/warehouse/country/:country', asyncHandler(getStoresByCountry));
router.get('/warehouse/:id/availability/:productId', asyncHandler(checkStoreAvailability));
router.get('/warehouse/:id', asyncHandler(getStoreById));

export const warehouseCustomerRouter = router;
