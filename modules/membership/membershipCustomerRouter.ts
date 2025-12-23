import express from 'express';
import {
  getMembershipTiers,
  getMembershipTierById,
  getTierBenefits,
  getUserMembershipByUserId,
  getUserMembershipBenefits,
} from './controllers/membershipCustomerController';

const router = express.Router();

// Get all active membership tiers
router.get('/membership/tiers', getMembershipTiers);

// Get specific membership tier details
router.get('/membership/tiers/:id', getMembershipTierById);

// Get benefits for a specific tier
router.get('/membership/tiers/:tierId/benefits', getTierBenefits);

// Get current user's membership
router.get('/membership/user/:userId', getUserMembershipByUserId);

// Get current user's membership benefits
router.get('/membership/user/:userId/benefits', getUserMembershipBenefits);

export const membershipCustomerRouter = router;
