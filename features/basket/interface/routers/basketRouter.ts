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
 * POST /api/basket
 */
router.post('/', basketController.getOrCreateBasket);

/**
 * Get current user's basket
 * GET /api/basket/me
 */
router.get('/me', basketController.getMyBasket);

/**
 * Merge baskets (typically when guest logs in)
 * POST /api/basket/merge
 */
router.post('/merge', basketController.mergeBaskets);

/**
 * Get basket by ID
 * GET /api/basket/:basketId
 */
router.get('/:basketId', basketController.getBasket);

/**
 * Get basket summary (lightweight response)
 * GET /api/basket/:basketId/summary
 */
router.get('/:basketId/summary', basketController.getBasketSummary);

/**
 * Add item to basket
 * POST /api/basket/:basketId/items
 */
router.post('/:basketId/items', basketController.addItem);

/**
 * Update item quantity
 * PATCH /api/basket/:basketId/items/:basketItemId
 */
router.patch('/:basketId/items/:basketItemId', basketController.updateItemQuantity);

/**
 * Remove item from basket
 * DELETE /api/basket/:basketId/items/:basketItemId
 */
router.delete('/:basketId/items/:basketItemId', basketController.removeItem);

/**
 * Clear all items from basket
 * DELETE /api/basket/:basketId/items
 */
router.delete('/:basketId/items', basketController.clearBasket);

/**
 * Set item as gift
 * POST /api/basket/:basketId/items/:basketItemId/gift
 */
router.post('/:basketId/items/:basketItemId/gift', basketController.setItemAsGift);

/**
 * Assign basket to customer
 * POST /api/basket/:basketId/assign
 */
router.post('/:basketId/assign', basketController.assignToCustomer);

/**
 * Extend basket expiration
 * PUT /api/basket/:basketId/expiration
 */
router.put('/:basketId/expiration', basketController.extendExpiration);

/**
 * Delete basket
 * DELETE /api/basket/:basketId
 */
router.delete('/:basketId', basketController.deleteBasket);

export const basketCustomerRouter = router;
export default router;
