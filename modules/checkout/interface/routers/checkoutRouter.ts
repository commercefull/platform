/**
 * Checkout Router
 * Defines API routes for checkout operations
 */

import express from 'express';
import * as checkoutController from '../controllers/CheckoutController';
import { optionalCustomerAuth } from '../../../../libs/auth';

const router = express.Router();

router.use(optionalCustomerAuth);

// ============================================================================
// Customer Checkout Routes
// ============================================================================

/**
 * Get available payment methods (no checkout required)
 * GET /checkout/payment-methods
 */
router.get('/checkout/payment-methods', checkoutController.getPaymentMethods);

/**
 * Get available pickup locations
 * GET /checkout/pickup-locations
 */
router.get('/checkout/pickup-locations', checkoutController.getPickupLocations);

/**
 * Set pickup location (BOPIS)
 * PUT /checkout/:checkoutId/pickup-location
 */
router.put('/checkout/:checkoutId/pickup-location', checkoutController.setPickupLocation);

/**
 * Get available pickup time slots
 * GET /checkout/:checkoutId/pickup-slots
 */
router.get('/checkout/:checkoutId/pickup-slots', checkoutController.getPickupSlots);

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
 * Set fulfillment method (shipping, pickup, local_delivery, digital)
 * PUT /checkout/:checkoutId/fulfillment-method
 */
router.put('/checkout/:checkoutId/fulfillment-method', checkoutController.setFulfillmentMethod);

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
 * Get local delivery options
 * GET /checkout/:checkoutId/local-delivery-options
 */
router.get('/checkout/:checkoutId/local-delivery-options', checkoutController.getLocalDeliveryOptions);

/**
 * Get all fulfillment options (unified)
 * GET /checkout/:checkoutId/fulfillment-options
 */
router.get('/checkout/:checkoutId/fulfillment-options', checkoutController.getFulfillmentOptions);

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
 * Create payment intent and draft order
 * POST /checkout/:checkoutId/payment-intent
 */
router.post('/checkout/:checkoutId/payment-intent', checkoutController.createPaymentIntent);

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
