/**
 * Loyalty Business Router
 *
 * Routes for loyalty management (merchant/admin access).
 * Mounted at /business/loyalty
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  adjustCustomerPoints,
  createReward,
  createTier,
  getCustomerPoints,
  getCustomerPointsTransactions,
  getCustomerRedemptions,
  getRewardById,
  getRewards,
  getTierById,
  getTiers,
  processOrderPoints,
  updateRedemptionStatus,
  updateReward,
  updateTier,
} from '../controllers/loyaltyBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

router.use(isOrganizationLoggedIn);

// Tier Management
router.get('/loyalty/tiers', asyncHandler(getTiers));
router.get('/loyalty/tiers/:id', asyncHandler(getTierById));
router.post('/loyalty/tiers', asyncHandler(createTier));
router.put('/loyalty/tiers/:id', asyncHandler(updateTier));

// Reward Management
router.get('/loyalty/rewards', asyncHandler(getRewards));
router.get('/loyalty/rewards/:id', asyncHandler(getRewardById));
router.post('/loyalty/rewards', asyncHandler(createReward));
router.put('/loyalty/rewards/:id', asyncHandler(updateReward));

// Customer Management
router.get('/loyalty/customers/:customerId/points', asyncHandler(getCustomerPoints));
router.get('/loyalty/customers/:customerId/transactions', asyncHandler(getCustomerPointsTransactions));
router.post('/loyalty/customers/:customerId/points/adjust', asyncHandler(adjustCustomerPoints));
router.get('/loyalty/customers/:customerId/redemptions', asyncHandler(getCustomerRedemptions));

// Redemption Management
router.put('/loyalty/redemptions/:id/status', asyncHandler(updateRedemptionStatus));

// Order Processing
router.post('/loyalty/orders/:orderId/points', asyncHandler(processOrderPoints));

export const loyaltyMerchantRouter = router;
