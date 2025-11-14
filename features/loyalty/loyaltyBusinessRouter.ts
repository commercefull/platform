import express from 'express';
import {adjustCustomerPoints, createReward, createTier, getCustomerPoints, getCustomerPointsTransactions, getCustomerRedemptions, getRewardById, getRewards, getTierById, getTiers, processOrderPoints, updateRedemptionStatus, updateReward, updateTier} from './controllers/loyaltyBusinessController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

router.use(isMerchantLoggedIn);

// Tier Management
router.get('/tiers', getTiers);
router.get('/tiers/:id', getTierById);
router.post('/tiers', createTier);
router.put('/tiers/:id', updateTier);

// Reward Management
router.get('/rewards', getRewards);
router.get('/rewards/:id', getRewardById);
router.post('/rewards', createReward);
router.put('/rewards/:id', updateReward);

// Customer Management
router.get('/customers/:customerId/points', getCustomerPoints);
router.get('/customers/:customerId/transactions', getCustomerPointsTransactions);
router.post('/customers/:customerId/points/adjust', adjustCustomerPoints);
router.get('/customers/:customerId/redemptions', getCustomerRedemptions);

// Redemption Management
router.put('/redemptions/:id/status', updateRedemptionStatus);

// Order Processing
router.post('/orders/:orderId/points', processOrderPoints);

export const loyaltyMerchantRouter = router;
