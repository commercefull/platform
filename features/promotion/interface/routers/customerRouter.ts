/**
 * Promotion Customer Router
 */

import express from 'express';
import * as giftCardController from '../../controllers/giftCardCustomerController';

const router = express.Router();

// Placeholder routes - implement with DDD controllers
router.post('/validate', (_req, res) => { res.json({ success: true, message: 'Validate code' }); });
router.get('/active', (_req, res) => { res.json({ success: true, message: 'Get active promotions' }); });

// Gift Card routes
router.get('/gift-cards/balance/:code', giftCardController.checkGiftCardBalance);
router.post('/gift-cards/redeem', giftCardController.redeemGiftCard);
router.get('/gift-cards/mine', giftCardController.getMyGiftCards);
router.post('/gift-cards/reload', giftCardController.reloadGiftCard);

export const promotionCustomerRouter = router;
