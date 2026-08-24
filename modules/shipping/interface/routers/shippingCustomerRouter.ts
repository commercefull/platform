/**
 * Shipping Public Router
 * Public routes for shipping (customer-facing)
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as shippingController from '../controllers/shippingController';

const router = Router();

// Get available shipping methods (for checkout)
router.get('/methods', asyncHandler(shippingController.getMethods));

// Calculate shipping rates for an order
router.post('/calculate-rates', asyncHandler(shippingController.calculateRates));

// Get packaging types (for reference)
router.get('/packaging-types', asyncHandler(shippingController.getPackagingTypes));

// Estimate delivery time for a shipping method
router.post('/estimate-delivery', asyncHandler(shippingController.estimateDelivery));

export const shippingCustomerRouter = router;
