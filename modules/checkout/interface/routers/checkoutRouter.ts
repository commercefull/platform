/**
 * Checkout Router
 * Defines API routes for checkout operations
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
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
router.get('/checkout/payment-methods', asyncHandler(checkoutController.getPaymentMethods));

/**
 * Get available pickup locations
 * GET /checkout/pickup-locations
 */
router.get('/checkout/pickup-locations', asyncHandler(checkoutController.getPickupLocations));

/**
 * Set pickup location (BOPIS)
 * PUT /checkout/:checkoutId/pickup-location
 */
router.put('/checkout/:checkoutId/pickup-location', asyncHandler(checkoutController.setPickupLocation));

/**
 * Get available pickup time slots
 * GET /checkout/:checkoutId/pickup-slots
 */
router.get('/checkout/:checkoutId/pickup-slots', asyncHandler(checkoutController.getPickupSlots));

/**
 * Initiate checkout session
 * POST /checkout
 */
router.post('/checkout', asyncHandler(checkoutController.initiateCheckout));

/**
 * Get checkout session
 * GET /checkout/:checkoutId
 */
router.get('/checkout/:checkoutId', asyncHandler(checkoutController.getCheckout));

/**
 * Get checkout summary
 * GET /checkout/:checkoutId/summary
 */
router.get('/checkout/:checkoutId/summary', asyncHandler(checkoutController.getCheckoutSummary));

/**
 * Set fulfillment method (shipping, pickup, local_delivery, digital)
 * PUT /checkout/:checkoutId/fulfillment-method
 */
router.put('/checkout/:checkoutId/fulfillment-method', asyncHandler(checkoutController.setFulfillmentMethod));

/**
 * Set shipping address
 * PUT /checkout/:checkoutId/shipping-address
 */
router.put('/checkout/:checkoutId/shipping-address', asyncHandler(checkoutController.setShippingAddress));

/**
 * Set billing address
 * PUT /checkout/:checkoutId/billing-address
 */
router.put('/checkout/:checkoutId/billing-address', asyncHandler(checkoutController.setBillingAddress));

/**
 * Get available shipping methods
 * GET /checkout/:checkoutId/shipping-methods
 */
router.get('/checkout/:checkoutId/shipping-methods', asyncHandler(checkoutController.getShippingMethods));

/**
 * Get local delivery options
 * GET /checkout/:checkoutId/local-delivery-options
 */
router.get('/checkout/:checkoutId/local-delivery-options', asyncHandler(checkoutController.getLocalDeliveryOptions));

/**
 * Get all fulfillment options (unified)
 * GET /checkout/:checkoutId/fulfillment-options
 */
router.get('/checkout/:checkoutId/fulfillment-options', asyncHandler(checkoutController.getFulfillmentOptions));

/**
 * Set shipping method
 * PUT /checkout/:checkoutId/shipping-method
 */
router.put('/checkout/:checkoutId/shipping-method', asyncHandler(checkoutController.setShippingMethod));

/**
 * Set payment method
 * PUT /checkout/:checkoutId/payment-method
 */
router.put('/checkout/:checkoutId/payment-method', asyncHandler(checkoutController.setPaymentMethod));

/**
 * Apply coupon code
 * POST /checkout/:checkoutId/coupon
 */
router.post('/checkout/:checkoutId/coupon', asyncHandler(checkoutController.applyCoupon));

/**
 * Remove coupon code
 * DELETE /checkout/:checkoutId/coupon
 */
router.delete('/checkout/:checkoutId/coupon', asyncHandler(checkoutController.removeCoupon));

/**
 * Create payment intent and draft order
 * POST /checkout/:checkoutId/payment-intent
 */
router.post('/checkout/:checkoutId/payment-intent', asyncHandler(checkoutController.createPaymentIntent));

/**
 * Complete checkout and create order
 * POST /checkout/:checkoutId/complete
 */
router.post('/checkout/:checkoutId/complete', asyncHandler(checkoutController.completeCheckout));

/**
 * Abandon checkout
 * POST /checkout/:checkoutId/abandon
 */
router.post('/checkout/:checkoutId/abandon', asyncHandler(checkoutController.abandonCheckout));

export const checkoutCustomerRouter = router;
