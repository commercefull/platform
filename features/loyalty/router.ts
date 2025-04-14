import express from 'express';
import { LoyaltyPublicController } from './controllers/loyaltyPublicController';
import { authenticate } from '../../middleware/auth'; // Assuming this middleware exists

const router = express.Router();
const loyaltyPublicController = new LoyaltyPublicController();

// Public routes (no authentication required)
router.get('/tiers', loyaltyPublicController.getPublicTiers);
router.get('/rewards', loyaltyPublicController.getPublicRewards);

// Customer authenticated routes
router.get('/my-status', authenticate, loyaltyPublicController.getMyLoyaltyStatus);
router.get('/my-transactions', authenticate, loyaltyPublicController.getMyTransactions);
router.get('/my-redemptions', authenticate, loyaltyPublicController.getMyRedemptions);
router.post('/redeem', authenticate, loyaltyPublicController.redeemReward);

export const loyaltyPublicRouter = router;
