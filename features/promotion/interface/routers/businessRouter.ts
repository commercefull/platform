/**
 * Promotion Business Router
 */

import express from 'express';
import * as giftCardController from '../../controllers/giftCardBusinessController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();
router.use(isMerchantLoggedIn);

// Placeholder routes - implement with DDD controllers
router.get('/promotions', (_req, res) => { res.json({ success: true, message: 'List promotions' }); });
router.post('/promotions', (_req, res) => { res.json({ success: true, message: 'Create promotion' }); });
router.get('/promotions/:promotionId', (_req, res) => { res.json({ success: true, message: 'Get promotion' }); });
router.put('/promotions/:promotionId', (_req, res) => { res.json({ success: true, message: 'Update promotion' }); });
router.delete('/promotions/:promotionId', (_req, res) => { res.json({ success: true, message: 'Delete promotion' }); });
router.post('/promotions/:promotionId/activate', (_req, res) => { res.json({ success: true, message: 'Activate promotion' }); });
router.post('/promotions/:promotionId/pause', (_req, res) => { res.json({ success: true, message: 'Pause promotion' }); });

// Gift Card routes
router.get('/gift-cards', giftCardController.getGiftCards);
router.get('/gift-cards/:id', giftCardController.getGiftCard);
router.post('/gift-cards', giftCardController.createGiftCard);
router.post('/gift-cards/:id/activate', giftCardController.activateGiftCard);
router.post('/gift-cards/:id/refund', giftCardController.refundToGiftCard);
router.post('/gift-cards/:id/cancel', giftCardController.cancelGiftCard);

export const promotionBusinessRouter = router;
