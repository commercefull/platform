/**
 * Basket Business Router
 * Admin/business routes for basket management
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  applyCouponAdmin,
  assignToCustomer,
  deleteBasket,
  extendExpiration,
  getBasket,
  getBasketSummary,
  listBaskets,
  removeCoupon,
} from '../controllers/BasketController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// List/search baskets (admin)
router.get('/basket', asyncHandler(listBaskets));

// Get basket by ID
router.get('/basket/:basketId', asyncHandler(getBasket));

// Get basket summary
router.get('/basket/:basketId/summary', asyncHandler(getBasketSummary));

// Apply coupon (admin override)
router.post('/basket/:basketId/coupon', asyncHandler(applyCouponAdmin));

// Remove coupon
router.delete('/basket/:basketId/coupon', asyncHandler(removeCoupon));

// Assign basket to customer
router.post('/basket/:basketId/assign', asyncHandler(assignToCustomer));

// Extend expiration
router.put('/basket/:basketId/expiration', asyncHandler(extendExpiration));

// Delete basket
router.delete('/basket/:basketId', asyncHandler(deleteBasket));

export const basketBusinessRouter = router;
export default router;
