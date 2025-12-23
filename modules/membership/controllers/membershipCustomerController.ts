import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { 
  MembershipRepo 
} from '../repos/membershipRepo';

// Create a single instance of the repository to be shared across handlers
const membershipRepo = new MembershipRepo();

// Public Membership Tier Endpoints
export const getMembershipTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    // For storefront, we only want to show active tiers
    const includeInactive = false;
    const tiers = await membershipRepo.findAllTiers(includeInactive);

    res.status(200).json({
      success: true,
      data: tiers
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership tiers',
      error: (error as Error).message
    });
  }
};

export const getMembershipTierById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tier = await membershipRepo.findTierById(id);

    // For storefront, only return active tiers
    if (!tier || !tier.isActive) {
      res.status(404).json({
        success: false,
        message: "Membership tier not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: tier
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership tier details',
      error: (error as Error).message
    });
  }
};

export const getTierBenefits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tierId } = req.params;
    
    // Check if tier exists and is active
    const tier = await membershipRepo.findTierById(tierId);
    if (!tier || !tier.isActive) {
      res.status(404).json({
        success: false,
        message: "Membership tier not found"
      });
      return;
    }
    
    const benefits = await membershipRepo.findBenefitsByTierId(tierId);
    
    res.status(200).json({
      success: true,
      data: benefits
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership tier benefits',
      error: (error as Error).message
    });
  }
};

// User Membership Public Endpoints
export const getUserMembershipByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const membership = await membershipRepo.findMembershipByUserId(userId);

    if (!membership) {
      res.status(404).json({
        success: false,
        message: `No active membership found for user with ID ${userId}`
      });
      return;
    }

    // For storefront, only return the membership if it's active
    if (!membership.isActive) {
      res.status(404).json({
        success: false,
        message: `No active membership found for user with ID ${userId}`
      });
      return;
    }

    // Get tier details to include with membership
    const tier = await membershipRepo.findTierById(membership.tierId);

    res.status(200).json({
      success: true,
      data: {
        ...membership,
        tier
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user membership',
      error: (error as Error).message
    });
  }
};

export const getUserMembershipBenefits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // First check if user has an active membership
    const membership = await membershipRepo.findMembershipByUserId(userId);
    if (!membership || !membership.isActive) {
      res.status(404).json({
        success: false,
        message: `No active membership found for user with ID ${userId}`
      });
      return;
    }
    
    const benefits = await membershipRepo.getUserMembershipBenefits(userId);

    res.status(200).json({
      success: true,
      data: benefits
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user membership benefits',
      error: (error as Error).message
    });
  }
};
