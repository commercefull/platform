import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getMyLoyaltyStatus,
  getMyRedemptions,
  getMyTransactions,
  getPublicRewards,
  getPublicTiers,
  redeemReward,
} from '../controllers/loyaltyCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Public routes (no authentication required)
router.get('/loyalty/tiers', asyncHandler(getPublicTiers));
router.get('/loyalty/rewards', asyncHandler(getPublicRewards));

// Customer authenticated routes
router.get('/loyalty/my-status', isCustomerLoggedIn, asyncHandler(getMyLoyaltyStatus));
router.get('/loyalty/my-transactions', isCustomerLoggedIn, asyncHandler(getMyTransactions));
router.get('/loyalty/my-redemptions', isCustomerLoggedIn, asyncHandler(getMyRedemptions));
router.post('/loyalty/redeem', isCustomerLoggedIn, asyncHandler(redeemReward));

export const loyaltyCustomerRouter = router;
