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
 * GET /checkout/payment-methods
 */
router.get('/checkout/payment-methods', checkoutController.getPaymentMethods);

/**
 * Initiate checkout session
 * POST /checkout
 */
router.post('/checkout', checkoutController.initiateCheckout);

/**
 * Get checkout session
 * GET /checkout/:checkoutId
 */
router.get('/checkout/:checkoutId', checkoutController.getCheckout);

/**
 * Set shipping address
 * PUT /checkout/:checkoutId/shipping-address
 */
router.put('/checkout/:checkoutId/shipping-address', checkoutController.setShippingAddress);

/**
 * Set billing address
 * PUT /checkout/:checkoutId/billing-address
 */
router.put('/checkout/:checkoutId/billing-address', checkoutController.setBillingAddress);

/**
 * Get available shipping methods
 * GET /checkout/:checkoutId/shipping-methods
 */
router.get('/checkout/:checkoutId/shipping-methods', checkoutController.getShippingMethods);

/**
 * Set shipping method
 * PUT /checkout/:checkoutId/shipping-method
 */
router.put('/checkout/:checkoutId/shipping-method', checkoutController.setShippingMethod);

/**
 * Set payment method
 * PUT /checkout/:checkoutId/payment-method
 */
router.put('/checkout/:checkoutId/payment-method', checkoutController.setPaymentMethod);

/**
 * Apply coupon code
 * POST /checkout/:checkoutId/coupon
 */
router.post('/checkout/:checkoutId/coupon', checkoutController.applyCoupon);

/**
 * Remove coupon code
 * DELETE /checkout/:checkoutId/coupon
 */
router.delete('/checkout/:checkoutId/coupon', checkoutController.removeCoupon);

/**
 * Complete checkout and create order
 * POST /checkout/:checkoutId/complete
 */
router.post('/checkout/:checkoutId/complete', checkoutController.completeCheckout);

/**
 * Abandon checkout
 * POST /checkout/:checkoutId/abandon
 */
router.post('/checkout/:checkoutId/abandon', checkoutController.abandonCheckout);

export const checkoutCustomerRouter = router;
