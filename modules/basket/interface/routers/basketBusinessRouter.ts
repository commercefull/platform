/**
 * Basket Business Router
 * Admin/business routes for basket management
 */

import express from 'express';
import * as basketController from '../controllers/BasketController';

const router = express.Router();

// List/search baskets (admin)
router.get('/', basketController.getBasket);

// Get basket by ID
router.get('/:basketId', basketController.getBasket);

// Get basket summary
router.get('/:basketId/summary', basketController.getBasketSummary);

// Apply coupon (admin override)
router.post('/:basketId/coupon', basketController.applyCoupon);

// Remove coupon
router.delete('/:basketId/coupon', basketController.removeCoupon);

// Assign basket to customer
router.post('/:basketId/assign', basketController.assignToCustomer);

// Extend expiration
router.put('/:basketId/expiration', basketController.extendExpiration);

// Delete basket
router.delete('/:basketId', basketController.deleteBasket);

export const basketBusinessRouter = router;
export default router;
