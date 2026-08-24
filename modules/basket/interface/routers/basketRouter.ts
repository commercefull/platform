/**
 * Basket Router
 * Defines API routes for basket operations
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as basketController from '../controllers/BasketController';

const router = express.Router();

// ============================================================================
// Customer/Public Routes
// ============================================================================

/**
 * Get or create basket for current user/session
 * POST /basket
 */
router.post('/basket', asyncHandler(basketController.getOrCreateBasket));

/**
 * Get current user's basket
 * GET /basket/me
 */
router.get('/basket/me', asyncHandler(basketController.getMyBasket));

/**
 * Merge baskets (typically when guest logs in)
 * POST /basket/merge
 */
router.post('/basket/merge', asyncHandler(basketController.mergeBaskets));

/**
 * Get basket by ID
 * GET /basket/:basketId
 */
router.get('/basket/:basketId', asyncHandler(basketController.getBasket));

/**
 * Get basket summary (lightweight response)
 * GET /basket/:basketId/summary
 */
router.get('/basket/:basketId/summary', asyncHandler(basketController.getBasketSummary));

/**
 * Add item to basket
 * POST /basket/:basketId/items
 */
router.post('/basket/:basketId/items', asyncHandler(basketController.addItem));

/**
 * Update item quantity
 * PATCH /basket/:basketId/items/:basketItemId
 */
router.patch('/basket/:basketId/items/:basketItemId', asyncHandler(basketController.updateItemQuantity));

/**
 * Remove item from basket
 * DELETE /basket/:basketId/items/:basketItemId
 */
router.delete('/basket/:basketId/items/:basketItemId', asyncHandler(basketController.removeItem));

/**
 * Clear all items from basket
 * DELETE /basket/:basketId/items
 */
router.delete('/basket/:basketId/items', asyncHandler(basketController.clearBasket));

/**
 * Set item as gift
 * POST /basket/:basketId/items/:basketItemId/gift
 */
router.post('/basket/:basketId/items/:basketItemId/gift', asyncHandler(basketController.setItemAsGift));

/**
 * Assign basket to customer
 * POST /basket/:basketId/assign
 */
router.post('/basket/:basketId/assign', asyncHandler(basketController.assignToCustomer));

/**
 * Apply coupon to basket
 * POST /basket/:basketId/coupon
 */
router.post('/basket/:basketId/coupon', asyncHandler(basketController.applyCoupon));

/**
 * Remove coupon from basket
 * DELETE /basket/:basketId/coupon
 */
router.delete('/basket/:basketId/coupon', asyncHandler(basketController.removeCoupon));

/**
 * Extend basket expiration
 * PUT /basket/:basketId/expiration
 */
router.put('/basket/:basketId/expiration', asyncHandler(basketController.extendExpiration));

/**
 * Delete basket
 * DELETE /basket/:basketId
 */
router.delete('/basket/:basketId', asyncHandler(basketController.deleteBasket));

export const basketCustomerRouter = router;
