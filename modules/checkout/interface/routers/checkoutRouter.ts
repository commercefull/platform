/**
 * Checkout Router
 * Defines API routes for checkout operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  abandonCheckout,
  applyCoupon,
  applyLoyaltyReward,
  completeCheckout,
  createPaymentIntent,
  getCheckout,
  getCheckoutSummary,
  getFulfillmentOptions,
  getLocalDeliveryOptions,
  getPaymentMethods,
  getPickupLocations,
  getPickupSlots,
  getShippingMethods,
  initiateCheckout,
  removeCoupon,
  removeLoyaltyReward,
  setBillingAddress,
  setFulfillmentMethod,
  setPaymentMethod,
  setPickupLocation,
  setShippingAddress,
  setShippingMethod,
  setVatNumber,
} from '../controllers/CheckoutController';
import { optionalCustomerAuth } from '../../../../libs/auth';

const router = createHttpRouter();

router.use(optionalCustomerAuth);

// ============================================================================
// Customer Checkout Routes
// ============================================================================

/**
 * Get available payment methods (no checkout required)
 * GET /checkout/payment-methods
 */
router.get('/checkout/payment-methods', asyncHandler(getPaymentMethods));

/**
 * Get available pickup locations
 * GET /checkout/pickup-locations
 */
router.get('/checkout/pickup-locations', asyncHandler(getPickupLocations));

/**
 * Set pickup location (BOPIS)
 * PUT /checkout/:checkoutId/pickup-location
 */
router.put('/checkout/:checkoutId/pickup-location', asyncHandler(setPickupLocation));

/**
 * Get available pickup time slots
 * GET /checkout/:checkoutId/pickup-slots
 */
router.get('/checkout/:checkoutId/pickup-slots', asyncHandler(getPickupSlots));

/**
 * Initiate checkout session
 * POST /checkout
 */
router.post('/checkout', asyncHandler(initiateCheckout));

/**
 * Get checkout session
 * GET /checkout/:checkoutId
 */
router.get('/checkout/:checkoutId', asyncHandler(getCheckout));

/**
 * Get checkout summary
 * GET /checkout/:checkoutId/summary
 */
router.get('/checkout/:checkoutId/summary', asyncHandler(getCheckoutSummary));

/**
 * Set fulfillment method (shipping, pickup, local_delivery, digital)
 * PUT /checkout/:checkoutId/fulfillment-method
 */
router.put('/checkout/:checkoutId/fulfillment-method', asyncHandler(setFulfillmentMethod));

/**
 * Set shipping address
 * PUT /checkout/:checkoutId/shipping-address
 */
router.put('/checkout/:checkoutId/shipping-address', asyncHandler(setShippingAddress));

/**
 * Set billing address
 * PUT /checkout/:checkoutId/billing-address
 */
router.put('/checkout/:checkoutId/billing-address', asyncHandler(setBillingAddress));

/**
 * Set customer VAT ID (B2B reverse charge)
 * PUT /checkout/:checkoutId/vat-number
 */
router.put('/checkout/:checkoutId/vat-number', asyncHandler(setVatNumber));

/**
 * Get available shipping methods
 * GET /checkout/:checkoutId/shipping-methods
 */
router.get('/checkout/:checkoutId/shipping-methods', asyncHandler(getShippingMethods));

/**
 * Get local delivery options
 * GET /checkout/:checkoutId/local-delivery-options
 */
router.get('/checkout/:checkoutId/local-delivery-options', asyncHandler(getLocalDeliveryOptions));

/**
 * Get all fulfillment options (unified)
 * GET /checkout/:checkoutId/fulfillment-options
 */
router.get('/checkout/:checkoutId/fulfillment-options', asyncHandler(getFulfillmentOptions));

/**
 * Set shipping method
 * PUT /checkout/:checkoutId/shipping-method
 */
router.put('/checkout/:checkoutId/shipping-method', asyncHandler(setShippingMethod));

/**
 * Set payment method
 * PUT /checkout/:checkoutId/payment-method
 */
router.put('/checkout/:checkoutId/payment-method', asyncHandler(setPaymentMethod));

/**
 * Apply coupon code
 * POST /checkout/:checkoutId/coupon
 */
router.post('/checkout/:checkoutId/coupon', asyncHandler(applyCoupon));

/**
 * Remove coupon code
 * DELETE /checkout/:checkoutId/coupon
 */
router.delete('/checkout/:checkoutId/coupon', asyncHandler(removeCoupon));

/**
 * Apply loyalty reward
 * POST /checkout/:checkoutId/loyalty-reward
 */
router.post('/checkout/:checkoutId/loyalty-reward', asyncHandler(applyLoyaltyReward));

/**
 * Remove loyalty reward
 * DELETE /checkout/:checkoutId/loyalty-reward
 */
router.delete('/checkout/:checkoutId/loyalty-reward', asyncHandler(removeLoyaltyReward));

/**
 * Create payment intent and draft order
 * POST /checkout/:checkoutId/payment-intent
 */
router.post('/checkout/:checkoutId/payment-intent', asyncHandler(createPaymentIntent));

/**
 * Complete checkout and create order
 * POST /checkout/:checkoutId/complete
 */
router.post('/checkout/:checkoutId/complete', asyncHandler(completeCheckout));

/**
 * Abandon checkout
 * POST /checkout/:checkoutId/abandon
 */
router.post('/checkout/:checkoutId/abandon', asyncHandler(abandonCheckout));

export const checkoutCustomerRouter = router;
