/**
 * Loyalty Business Router
 *
 * Routes for loyalty management (merchant/admin access).
 * Mounted at /business/loyalty
 */

import express from 'express';
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
} from './controllers/loyaltyBusinessController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

router.use(isMerchantLoggedIn);

// Tier Management
router.get('/loyalty/tiers', getTiers);
router.get('/loyalty/tiers/:id', getTierById);
router.post('/loyalty/tiers', createTier);
router.put('/loyalty/tiers/:id', updateTier);

// Reward Management
router.get('/loyalty/rewards', getRewards);
router.get('/loyalty/rewards/:id', getRewardById);
router.post('/loyalty/rewards', createReward);
router.put('/loyalty/rewards/:id', updateReward);

// Customer Management
router.get('/loyalty/customers/:customerId/points', getCustomerPoints);
router.get('/loyalty/customers/:customerId/transactions', getCustomerPointsTransactions);
router.post('/loyalty/customers/:customerId/points/adjust', adjustCustomerPoints);
router.get('/loyalty/customers/:customerId/redemptions', getCustomerRedemptions);

// Redemption Management
router.put('/loyalty/redemptions/:id/status', updateRedemptionStatus);

// Order Processing
router.post('/loyalty/orders/:orderId/points', processOrderPoints);

export const loyaltyMerchantRouter = router;
