/**
 * Shipping Public Router
 * Public routes for shipping (customer-facing)
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  calculateRates,
  estimateDelivery,
  getMethods,
  getPackagingTypes,
} from '../controllers/shippingController';
const router = createHttpRouter();

// Get available shipping methods (for checkout)
router.get('/methods', asyncHandler(getMethods));

// Calculate shipping rates for an order
router.post('/calculate-rates', asyncHandler(calculateRates));

// Get packaging types (for reference)
router.get('/packaging-types', asyncHandler(getPackagingTypes));

// Estimate delivery time for a shipping method
router.post('/estimate-delivery', asyncHandler(estimateDelivery));

export const shippingCustomerRouter = router;
