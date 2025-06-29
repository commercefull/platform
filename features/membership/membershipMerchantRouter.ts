import express from "express";
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
  getUserMembershipBenefits
} from "./controllers/membershipMerchantController";
import { isMerchantLoggedIn } from "../../libs/auth";

const router = express.Router();

router.use(isMerchantLoggedIn);

// Admin routes for membership tier management
router.get("/tiers", getMembershipTiers);
router.get("/tiers/:id", getMembershipTierById);
router.post("/tiers", createMembershipTier);
router.put("/tiers/:id", updateMembershipTier);
router.delete("/tiers/:id", deleteMembershipTier);

// Admin routes for membership benefit management
router.get("/benefits", getMembershipBenefits);
router.get("/benefits/:id", getMembershipBenefitById);
router.post("/benefits", createMembershipBenefit);
router.put("/benefits/:id", updateMembershipBenefit);
router.delete("/benefits/:id", deleteMembershipBenefit);

// Admin routes for user membership management
router.get("/user-memberships", getUserMemberships);
router.get("/user-memberships/:id", getUserMembershipById);
router.post("/user-memberships", createUserMembership);
router.put("/user-memberships/:id", updateUserMembership);
router.post("/user-memberships/:id/cancel", cancelUserMembership);

// Admin routes for fetching user-specific membership data
router.get("/users/:userId/membership", getUserMembershipByUserId);
router.get("/users/:userId/benefits", getUserMembershipBenefits);

export const membershipMerchantRouter = router;
