import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getMembershipTiers,
  getMembershipTierById,
  createMembershipTier,
  updateMembershipTier,
  deleteMembershipTier,
  getMembershipBenefits,
  getMembershipBenefitById,
  createMembershipBenefit,
  updateMembershipBenefit,
  deleteMembershipBenefit,
  getUserMemberships,
  getUserMembershipById,
  getUserMembershipByUserId,
  createUserMembership,
  updateUserMembership,
  cancelUserMembership,
  getUserMembershipBenefits,
} from '../controllers/membershipBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

router.use(isOrganizationLoggedIn);

// Admin routes for membership tier management
router.get('/membership/tiers', asyncHandler(getMembershipTiers));
router.get('/membership/tiers/:id', asyncHandler(getMembershipTierById));
router.post('/membership/tiers', asyncHandler(createMembershipTier));
router.put('/membership/tiers/:id', asyncHandler(updateMembershipTier));
router.delete('/membership/tiers/:id', asyncHandler(deleteMembershipTier));

// Admin routes for membership benefit management
router.get('/membership/benefits', asyncHandler(getMembershipBenefits));
router.get('/membership/benefits/:id', asyncHandler(getMembershipBenefitById));
router.post('/membership/benefits', asyncHandler(createMembershipBenefit));
router.put('/membership/benefits/:id', asyncHandler(updateMembershipBenefit));
router.delete('/membership/benefits/:id', asyncHandler(deleteMembershipBenefit));

// Admin routes for user membership management
router.get('/membership/user-memberships', asyncHandler(getUserMemberships));
router.get('/membership/user-memberships/:id', asyncHandler(getUserMembershipById));
router.post('/membership/user-memberships', asyncHandler(createUserMembership));
router.put('/membership/user-memberships/:id', asyncHandler(updateUserMembership));
router.post('/membership/user-memberships/:id/cancel', asyncHandler(cancelUserMembership));

// Admin routes for fetching user-specific membership data
router.get('/membership/users/:userId/membership', asyncHandler(getUserMembershipByUserId));
router.get('/membership/users/:userId/benefits', asyncHandler(getUserMembershipBenefits));

export const membershipBusinessRouter = router;
