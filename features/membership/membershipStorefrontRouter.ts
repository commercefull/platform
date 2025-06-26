import express from "express";
import {
  getMembershipTiers,
  getUserMembershipByUserId,
  getUserMembershipBenefits
} from "./controllers/membershipController";
import { MembershipRepo } from "./repos/membershipRepo";

const router = express.Router();

// Get all active membership tiers
router.get("/tiers", (req, res, next) => {
  // Force includeInactive to false for public API
  req.query.includeInactive = 'false';
  next();
}, getMembershipTiers);

// Get specific membership tier details
router.get("/tiers/:id", async (req: any, res: any) => {
  try {
    const membershipRepo = new MembershipRepo();
    const tier = await membershipRepo.findTierById(req.params.id);
    
    // Only return active tiers on public API
    if (!tier || !tier.isActive) {
      return res.status(404).json({
        success: false,
        message: "Membership tier not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: tier
    });
  } catch (error) {
    console.error('Error fetching membership tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership tier details'
    });
  }
});

// Get benefits for a specific tier
router.get("/tiers/:tierId/benefits", async (req: any, res: any) => {
  try {
    const membershipRepo = new MembershipRepo();
    
    // Check if tier exists and is active
    const tier = await membershipRepo.findTierById(req.params.tierId);
    if (!tier || !tier.isActive) {
      return res.status(404).json({
        success: false,
        message: "Membership tier not found"
      });
    }
    
    const benefits = await membershipRepo.findBenefitsByTierId(req.params.tierId);
    
    res.status(200).json({
      success: true,
      data: benefits
    });
  } catch (error) {
    console.error('Error fetching membership tier benefits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership tier benefits'
    });
  }
});

// Get current user's membership
router.get("/user/:userId", getUserMembershipByUserId);

// Get current user's membership benefits
router.get("/user/:userId/benefits", getUserMembershipBenefits);

export const membershipStorefrontRouter = router;
