/**
 * Basket Router
 * Defines API routes for basket operations
 */

import express from 'express';
import * as basketController from '../controllers/BasketController';

const router = express.Router();

// ============================================================================
// Customer/Public Routes
// ============================================================================

/**
 * Get or create basket for current user/session
 * POST /basket
 */
router.post('/basket', basketController.getOrCreateBasket);

/**
 * Get current user's basket
 * GET /basket/me
 */
router.get('/basket/me', basketController.getMyBasket);

/**
 * Merge baskets (typically when guest logs in)
 * POST /basket/merge
 */
router.post('/basket/merge', basketController.mergeBaskets);

/**
 * Get basket by ID
 * GET /basket/:basketId
 */
router.get('/basket/:basketId', basketController.getBasket);

/**
 * Get basket summary (lightweight response)
 * GET /basket/:basketId/summary
 */
router.get('/basket/:basketId/summary', basketController.getBasketSummary);

/**
 * Add item to basket
 * POST /basket/:basketId/items
 */
router.post('/basket/:basketId/items', basketController.addItem);

/**
 * Update item quantity
 * PATCH /basket/:basketId/items/:basketItemId
 */
router.patch('/basket/:basketId/items/:basketItemId', basketController.updateItemQuantity);

/**
 * Remove item from basket
 * DELETE /basket/:basketId/items/:basketItemId
 */
router.delete('/basket/:basketId/items/:basketItemId', basketController.removeItem);

/**
 * Clear all items from basket
 * DELETE /basket/:basketId/items
 */
router.delete('/basket/:basketId/items', basketController.clearBasket);

/**
 * Set item as gift
 * POST /basket/:basketId/items/:basketItemId/gift
 */
router.post('/basket/:basketId/items/:basketItemId/gift', basketController.setItemAsGift);

/**
 * Assign basket to customer
 * POST /basket/:basketId/assign
 */
router.post('/basket/:basketId/assign', basketController.assignToCustomer);

/**
 * Extend basket expiration
 * PUT /basket/:basketId/expiration
 */
router.put('/basket/:basketId/expiration', basketController.extendExpiration);

/**
 * Delete basket
 * DELETE /basket/:basketId
 */
router.delete('/basket/:basketId', basketController.deleteBasket);

export const basketCustomerRouter = router;
