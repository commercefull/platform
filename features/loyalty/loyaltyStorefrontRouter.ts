import express from 'express';
import * as loyaltyController from './controllers/loyaltyStorefrontController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/tiers', loyaltyController.getPublicTiers);
router.get('/rewards', loyaltyController.getPublicRewards);

// Customer authenticated routes
router.get('/my-status', isCustomerLoggedIn, loyaltyController.getMyLoyaltyStatus);
router.get('/my-transactions', isCustomerLoggedIn, loyaltyController.getMyTransactions);
router.get('/my-redemptions', isCustomerLoggedIn, loyaltyController.getMyRedemptions);
router.post('/redeem', isCustomerLoggedIn, loyaltyController.redeemReward);

export const loyaltyStorefrontRouter = router;
