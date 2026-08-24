/**
 * Promotion Customer Router
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
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
router.post('/gift-cards/redeem', asyncHandler(giftCardController.redeemGiftCard));
router.get('/gift-cards/mine', asyncHandler(giftCardController.getMyGiftCards));
router.post('/gift-cards/reload', asyncHandler(giftCardController.reloadGiftCard));

export const promotionCustomerRouter = router;
