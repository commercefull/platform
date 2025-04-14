import express from 'express';
import { LoyaltyController } from './controllers/loyaltyController';

const router = express.Router();
const loyaltyController = new LoyaltyController();

// Tier Management
router.get('/tiers', loyaltyController.getTiers);
router.get('/tiers/:id', loyaltyController.getTierById);
router.post('/tiers', loyaltyController.createTier);
router.put('/tiers/:id', loyaltyController.updateTier);

// Reward Management
router.get('/rewards', loyaltyController.getRewards);
router.get('/rewards/:id', loyaltyController.getRewardById);
router.post('/rewards', loyaltyController.createReward);
router.put('/rewards/:id', loyaltyController.updateReward);

// Customer Management
router.get('/customers/:customerId/points', loyaltyController.getCustomerPoints);
router.get('/customers/:customerId/transactions', loyaltyController.getCustomerTransactions);
router.post('/customers/:customerId/points/adjust', loyaltyController.adjustCustomerPoints);
router.get('/customers/:customerId/redemptions', loyaltyController.getCustomerRedemptions);

// Redemption Management
router.put('/redemptions/:id/status', loyaltyController.updateRedemptionStatus);

// Order Processing
router.post('/orders/:orderId/points', loyaltyController.processOrderPoints);

export const loyaltyAdminRouter = router;
