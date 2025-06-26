import express from 'express';
import { LoyaltyPublicController } from './controllers/loyaltyPublicController';
import { isLoggedIn } from '../../libs/middlewares';

const router = express.Router();
const loyaltyPublicController = new LoyaltyPublicController();

// Public routes (no authentication required)
router.get('/tiers', loyaltyPublicController.getPublicTiers);
router.get('/rewards', loyaltyPublicController.getPublicRewards);

// Customer authenticated routes
router.get('/my-status', isLoggedIn, loyaltyPublicController.getMyLoyaltyStatus);
router.get('/my-transactions', isLoggedIn, loyaltyPublicController.getMyTransactions);
router.get('/my-redemptions', isLoggedIn, loyaltyPublicController.getMyRedemptions);
router.post('/redeem', isLoggedIn, loyaltyPublicController.redeemReward);

export const loyaltyStorefrontRouter = router;
