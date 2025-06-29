import express from "express";
import {
  getMembershipTiers,
  getMembershipTierById,
  getTierBenefits,
  getUserMembershipByUserId,
  getUserMembershipBenefits
} from "./controllers/membershipCustomerController";

const router = express.Router();

// Get all active membership tiers
router.get("/tiers", getMembershipTiers);

// Get specific membership tier details
router.get("/tiers/:id", getMembershipTierById);

// Get benefits for a specific tier
router.get("/tiers/:tierId/benefits", getTierBenefits);

// Get current user's membership
router.get("/user/:userId", getUserMembershipByUserId);

// Get current user's membership benefits
router.get("/user/:userId/benefits", getUserMembershipBenefits);

export const membershipCustomerRouter = router;
