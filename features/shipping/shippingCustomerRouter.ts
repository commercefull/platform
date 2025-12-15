/**
 * Shipping Public Router
 * Public routes for shipping (customer-facing)
 */

import { Router } from 'express';
import * as shippingController from './controllers/shippingController';

const router = Router();

// Get available shipping methods (for checkout)
router.get('/methods', shippingController.getMethods);

// Calculate shipping rates for an order
router.post('/calculate-rates', shippingController.calculateRates);

// Get packaging types (for reference)
router.get('/packaging-types', shippingController.getPackagingTypes);

export const shippingCustomerRouter = router;

