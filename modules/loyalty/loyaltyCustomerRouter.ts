import express from 'express';
import * as loyaltyController from './controllers/loyaltyCustomerController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/loyalty/tiers', loyaltyController.getPublicTiers);
router.get('/loyalty/rewards', loyaltyController.getPublicRewards);

// Customer authenticated routes
router.get('/loyalty/my-status', isCustomerLoggedIn, loyaltyController.getMyLoyaltyStatus);
router.get('/loyalty/my-transactions', isCustomerLoggedIn, loyaltyController.getMyTransactions);
router.get('/loyalty/my-redemptions', isCustomerLoggedIn, loyaltyController.getMyRedemptions);
router.post('/loyalty/redeem', isCustomerLoggedIn, loyaltyController.redeemReward);

export const loyaltyCustomerRouter = router;
