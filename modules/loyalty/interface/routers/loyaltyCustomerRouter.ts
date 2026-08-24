import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as loyaltyController from '../controllers/loyaltyCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/loyalty/tiers', asyncHandler(loyaltyController.getPublicTiers));
router.get('/loyalty/rewards', asyncHandler(loyaltyController.getPublicRewards));

// Customer authenticated routes
router.get('/loyalty/my-status', isCustomerLoggedIn, asyncHandler(loyaltyController.getMyLoyaltyStatus));
router.get('/loyalty/my-transactions', isCustomerLoggedIn, asyncHandler(loyaltyController.getMyTransactions));
router.get('/loyalty/my-redemptions', isCustomerLoggedIn, asyncHandler(loyaltyController.getMyRedemptions));
router.post('/loyalty/redeem', isCustomerLoggedIn, asyncHandler(loyaltyController.redeemReward));

export const loyaltyCustomerRouter = router;
