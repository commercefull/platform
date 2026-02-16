/**
 * Shipping Public Router
 * Public routes for shipping (customer-facing)
 */

import { Router } from 'express';
import * as shippingController from '../controllers/shippingController';

const router = Router();

// Get available shipping methods (for checkout)
router.get('/methods', shippingController.getMethods);

// Calculate shipping rates for an order
router.post('/calculate-rates', shippingController.calculateRates);

// Get packaging types (for reference)
router.get('/packaging-types', shippingController.getPackagingTypes);

// Estimate delivery time for a shipping method
router.post('/estimate-delivery', shippingController.estimateDelivery);

export const shippingCustomerRouter = router;
