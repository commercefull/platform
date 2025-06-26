import express from "express";
import { MembershipController } from "./controllers/membershipController";

const router = express.Router();
const membershipController = new MembershipController();

// Admin routes for membership tier management
router.get("/tiers", membershipController.getMembershipTiers);
router.get("/tiers/:id", membershipController.getMembershipTierById);
router.post("/tiers", membershipController.createMembershipTier);
router.put("/tiers/:id", membershipController.updateMembershipTier);
router.delete("/tiers/:id", membershipController.deleteMembershipTier);

// Admin routes for membership benefit management
router.get("/benefits", membershipController.getMembershipBenefits);
router.get("/benefits/:id", membershipController.getMembershipBenefitById);
router.post("/benefits", membershipController.createMembershipBenefit);
router.put("/benefits/:id", membershipController.updateMembershipBenefit);
router.delete("/benefits/:id", membershipController.deleteMembershipBenefit);

// Admin routes for user membership management
router.get("/user-memberships", membershipController.getUserMemberships);
router.get("/user-memberships/:id", membershipController.getUserMembershipById);
router.post("/user-memberships", membershipController.createUserMembership);
router.put("/user-memberships/:id", membershipController.updateUserMembership);
router.post("/user-memberships/:id/cancel", membershipController.cancelUserMembership);

// Admin routes for fetching user-specific membership data
router.get("/users/:userId/membership", membershipController.getUserMembershipByUserId);
router.get("/users/:userId/benefits", membershipController.getUserMembershipBenefits);

export const membershipBusinessRouter = router;
