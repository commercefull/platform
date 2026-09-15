/**
 * Promotion Customer Router
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import * as giftCardController from '../controllers/giftCardCustomerController';

const router = express.Router();

// Placeholder routes - implement with DDD controllers
router.post('/validate', (_req, res) => {
  res.json({ success: true, message: 'Validate code' });
});
router.get('/active', (_req, res) => {
  res.json({ success: true, message: 'Get active promotions' });
});

// Gift Card routes
router.get('/gift-cards/balance/:code', asyncHandler(giftCardController.checkGiftCardBalance));
router.post('/gift-cards/redeem', isCustomerLoggedIn, asyncHandler(giftCardController.redeemGiftCard));
router.get('/gift-cards/mine', isCustomerLoggedIn, asyncHandler(giftCardController.getMyGiftCards));
router.post('/gift-cards/reload', isCustomerLoggedIn, asyncHandler(giftCardController.reloadGiftCard));

export const promotionCustomerRouter = router;
