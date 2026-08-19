/**
 * Basket Business Router
 * Admin/business routes for basket management
 */

import express from 'express';
import * as basketController from '../controllers/BasketController';

const router = express.Router();

// List/search baskets (admin)
router.get('/basket', basketController.listBaskets);

// Get basket by ID
router.get('/basket/:basketId', basketController.getBasket);

// Get basket summary
router.get('/basket/:basketId/summary', basketController.getBasketSummary);

// Apply coupon (admin override)
router.post('/basket/:basketId/coupon', basketController.applyCouponAdmin);

// Remove coupon
router.delete('/basket/:basketId/coupon', basketController.removeCoupon);

// Assign basket to customer
router.post('/basket/:basketId/assign', basketController.assignToCustomer);

// Extend expiration
router.put('/basket/:basketId/expiration', basketController.extendExpiration);

// Delete basket
router.delete('/basket/:basketId', basketController.deleteBasket);

export const basketBusinessRouter = router;
export default router;
