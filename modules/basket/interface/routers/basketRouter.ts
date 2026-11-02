/**
 * Basket Router
 * Defines API routes for basket operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  addItem,
  applyCoupon,
  assignToCustomer,
  clearBasket,
  deleteBasket,
  extendExpiration,
  getBasket,
  getBasketSummary,
  getMyBasket,
  getOrCreateBasket,
  mergeBaskets,
  removeCoupon,
  removeItem,
  setItemAsGift,
  updateItemQuantity,
} from '../controllers/BasketController';
const router = createHttpRouter();

// ============================================================================
// Customer/Public Routes
// ============================================================================

/**
 * Get or create basket for current user/session
 * POST /basket
 */
router.post('/basket', asyncHandler(getOrCreateBasket));

/**
 * Get current user's basket
 * GET /basket/me
 */
router.get('/basket/me', asyncHandler(getMyBasket));

/**
 * Merge baskets (typically when guest logs in)
 * POST /basket/merge
 */
router.post('/basket/merge', asyncHandler(mergeBaskets));

/**
 * Get basket by ID
 * GET /basket/:basketId
 */
router.get('/basket/:basketId', asyncHandler(getBasket));

/**
 * Get basket summary (lightweight response)
 * GET /basket/:basketId/summary
 */
router.get('/basket/:basketId/summary', asyncHandler(getBasketSummary));

/**
 * Add item to basket
 * POST /basket/:basketId/items
 */
router.post('/basket/:basketId/items', asyncHandler(addItem));

/**
 * Update item quantity
 * PATCH /basket/:basketId/items/:basketItemId
 */
router.patch('/basket/:basketId/items/:basketItemId', asyncHandler(updateItemQuantity));

/**
 * Remove item from basket
 * DELETE /basket/:basketId/items/:basketItemId
 */
router.delete('/basket/:basketId/items/:basketItemId', asyncHandler(removeItem));

/**
 * Clear all items from basket
 * DELETE /basket/:basketId/items
 */
router.delete('/basket/:basketId/items', asyncHandler(clearBasket));

/**
 * Set item as gift
 * POST /basket/:basketId/items/:basketItemId/gift
 */
router.post('/basket/:basketId/items/:basketItemId/gift', asyncHandler(setItemAsGift));

/**
 * Assign basket to customer
 * POST /basket/:basketId/assign
 */
router.post('/basket/:basketId/assign', asyncHandler(assignToCustomer));

/**
 * Apply coupon to basket
 * POST /basket/:basketId/coupon
 */
router.post('/basket/:basketId/coupon', asyncHandler(applyCoupon));

/**
 * Remove coupon from basket
 * DELETE /basket/:basketId/coupon
 */
router.delete('/basket/:basketId/coupon', asyncHandler(removeCoupon));

/**
 * Extend basket expiration
 * PUT /basket/:basketId/expiration
 */
router.put('/basket/:basketId/expiration', asyncHandler(extendExpiration));

/**
 * Delete basket
 * DELETE /basket/:basketId
 */
router.delete('/basket/:basketId', asyncHandler(deleteBasket));

export const basketCustomerRouter = router;
