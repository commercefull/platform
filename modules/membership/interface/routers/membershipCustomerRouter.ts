import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getMembershipTiers,
  getMembershipTierById,
  getTierBenefits,
  getUserMembershipByUserId,
  getUserMembershipBenefits,
} from '../controllers/membershipCustomerController';

const router = express.Router();

// Get all active membership tiers
router.get('/membership/tiers', asyncHandler(getMembershipTiers));

// Get specific membership tier details
router.get('/membership/tiers/:id', asyncHandler(getMembershipTierById));

// Get benefits for a specific tier
router.get('/membership/tiers/:tierId/benefits', asyncHandler(getTierBenefits));

// Get current user's membership
router.get('/membership/user/:userId', asyncHandler(getUserMembershipByUserId));

// Get current user's membership benefits
router.get('/membership/user/:userId/benefits', asyncHandler(getUserMembershipBenefits));

export const membershipCustomerRouter = router;
