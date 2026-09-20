/**
 * Basket Business Router
 * Admin/business routes for basket management
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as basketController from '../controllers/BasketController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// List/search baskets (admin)
router.get('/basket', asyncHandler(basketController.listBaskets));

// Get basket by ID
router.get('/basket/:basketId', asyncHandler(basketController.getBasket));

// Get basket summary
router.get('/basket/:basketId/summary', asyncHandler(basketController.getBasketSummary));

// Apply coupon (admin override)
router.post('/basket/:basketId/coupon', asyncHandler(basketController.applyCouponAdmin));

// Remove coupon
router.delete('/basket/:basketId/coupon', asyncHandler(basketController.removeCoupon));

// Assign basket to customer
router.post('/basket/:basketId/assign', asyncHandler(basketController.assignToCustomer));

// Extend expiration
router.put('/basket/:basketId/expiration', asyncHandler(basketController.extendExpiration));

// Delete basket
router.delete('/basket/:basketId', asyncHandler(basketController.deleteBasket));

export const basketBusinessRouter = router;
export default router;
