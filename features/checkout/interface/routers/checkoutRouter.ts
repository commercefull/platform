/**
 * Checkout Router
 * Defines API routes for checkout operations
 */

import express from 'express';
import * as checkoutController from '../controllers/CheckoutController';

const router = express.Router();

// ============================================================================
// Customer Checkout Routes
// ============================================================================

/**
 * Get available payment methods (no checkout required)
 * GET /api/checkout/payment-methods
 */
router.get('/payment-methods', checkoutController.getPaymentMethods);

/**
 * Initiate checkout session
 * POST /api/checkout
 */
router.post('/', checkoutController.initiateCheckout);

/**
 * Get checkout session
 * GET /api/checkout/:checkoutId
 */
router.get('/:checkoutId', checkoutController.getCheckout);

/**
 * Set shipping address
 * PUT /api/checkout/:checkoutId/shipping-address
 */
router.put('/:checkoutId/shipping-address', checkoutController.setShippingAddress);

/**
 * Set billing address
 * PUT /api/checkout/:checkoutId/billing-address
 */
router.put('/:checkoutId/billing-address', checkoutController.setBillingAddress);

/**
 * Get available shipping methods
 * GET /api/checkout/:checkoutId/shipping-methods
 */
router.get('/:checkoutId/shipping-methods', checkoutController.getShippingMethods);

/**
 * Set shipping method
 * PUT /api/checkout/:checkoutId/shipping-method
 */
router.put('/:checkoutId/shipping-method', checkoutController.setShippingMethod);

/**
 * Set payment method
 * PUT /api/checkout/:checkoutId/payment-method
 */
router.put('/:checkoutId/payment-method', checkoutController.setPaymentMethod);

/**
 * Apply coupon code
 * POST /api/checkout/:checkoutId/coupon
 */
router.post('/:checkoutId/coupon', checkoutController.applyCoupon);

/**
 * Remove coupon code
 * DELETE /api/checkout/:checkoutId/coupon
 */
router.delete('/:checkoutId/coupon', checkoutController.removeCoupon);

/**
 * Complete checkout and create order
 * POST /api/checkout/:checkoutId/complete
 */
router.post('/:checkoutId/complete', checkoutController.completeCheckout);

/**
 * Abandon checkout
 * POST /api/checkout/:checkoutId/abandon
 */
router.post('/:checkoutId/abandon', checkoutController.abandonCheckout);

export const checkoutCustomerRouter = router;
export default router;
