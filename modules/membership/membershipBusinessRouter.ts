import express from 'express';
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
} from './controllers/membershipBusinessController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

router.use(isMerchantLoggedIn);

// Admin routes for membership tier management
router.get('/membership/tiers', getMembershipTiers);
router.get('/membership/tiers/:id', getMembershipTierById);
router.post('/membership/tiers', createMembershipTier);
router.put('/membership/tiers/:id', updateMembershipTier);
router.delete('/membership/tiers/:id', deleteMembershipTier);

// Admin routes for membership benefit management
router.get('/membership/benefits', getMembershipBenefits);
router.get('/membership/benefits/:id', getMembershipBenefitById);
router.post('/membership/benefits', createMembershipBenefit);
router.put('/membership/benefits/:id', updateMembershipBenefit);
router.delete('/membership/benefits/:id', deleteMembershipBenefit);

// Admin routes for user membership management
router.get('/membership/user-memberships', getUserMemberships);
router.get('/membership/user-memberships/:id', getUserMembershipById);
router.post('/membership/user-memberships', createUserMembership);
router.put('/membership/user-memberships/:id', updateUserMembership);
router.post('/membership/user-memberships/:id/cancel', cancelUserMembership);

// Admin routes for fetching user-specific membership data
router.get('/membership/users/:userId/membership', getUserMembershipByUserId);
router.get('/membership/users/:userId/benefits', getUserMembershipBenefits);

export const membershipBusinessRouter = router;
