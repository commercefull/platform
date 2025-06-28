import { Request, Response } from 'express';
import { 
  MembershipRepo, 
  MembershipTier, 
  MembershipBenefit, 
  UserMembership 
} from '../repos/membershipRepo';

// Create a single instance of the repository to be shared across handlers
const membershipRepo = new MembershipRepo();

// Membership Tier Endpoints
export const getMembershipTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const tiers = await membershipRepo.findAllTiers(includeInactive);

    res.status(200).json({
      success: true,
      data: tiers
    });
  } catch (error) {
    console.error('Error fetching membership tiers:', error);
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

    if (!tier) {
      res.status(404).json({
        success: false,
        message: `Membership tier with ID ${id} not found`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: tier
    });
  } catch (error) {
    console.error('Error fetching membership tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership tier',
      error: (error as Error).message
    });
  }
};

export const createMembershipTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      monthlyPrice,
      annualPrice,
      level,
      isActive = true
    } = req.body;

    // Basic validation
    if (!name || typeof monthlyPrice !== 'number' || typeof annualPrice !== 'number' || typeof level !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Name, monthlyPrice, annualPrice, and level are required'
      });
      return;
    }

    const tier = await membershipRepo.createTier({
      name,
      description,
      monthlyPrice,
      annualPrice,
      level,
      isActive
    });

    res.status(201).json({
      success: true,
      data: tier,
      message: 'Membership tier created successfully'
    });
  } catch (error) {
    console.error('Error creating membership tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create membership tier',
      error: (error as Error).message
    });
  }
};

export const updateMembershipTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      monthlyPrice,
      annualPrice,
      level,
      isActive
    } = req.body;

    // Check if tier exists
    const existingTier = await membershipRepo.findTierById(id);
    if (!existingTier) {
      res.status(404).json({
        success: false,
        message: `Membership tier with ID ${id} not found`
      });
      return;
    }

    const updatedTier = await membershipRepo.updateTier(id, {
      name,
      description,
      monthlyPrice,
      annualPrice,
      level,
      isActive
    });

    res.status(200).json({
      success: true,
      data: updatedTier,
      message: 'Membership tier updated successfully'
    });
  } catch (error) {
    console.error('Error updating membership tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update membership tier',
      error: (error as Error).message
    });
  }
};

export const deleteMembershipTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if tier exists
    const existingTier = await membershipRepo.findTierById(id);
    if (!existingTier) {
      res.status(404).json({
        success: false,
        message: `Membership tier with ID ${id} not found`
      });
      return;
    }

    // Check if there are active memberships using this tier
    const activeMembers = await membershipRepo.findAllUserMemberships(50, 0, { tierId: id, isActive: true });
    if (activeMembers && activeMembers.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete tier: ${activeMembers.length} active user memberships are using this tier`
      });
      return;
    }

    await membershipRepo.deleteTier(id);

    res.status(200).json({
      success: true,
      message: 'Membership tier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting membership tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete membership tier',
      error: (error as Error).message
    });
  }
};

// Membership Benefit Endpoints
export const getMembershipBenefits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tierId } = req.query;
    
    let benefits;
    if (tierId) {
      benefits = await membershipRepo.findBenefitsByTierId(tierId as string);
    } else {
      benefits = await membershipRepo.findAllBenefits();
    }

    res.status(200).json({
      success: true,
      data: benefits
    });
  } catch (error) {
    console.error('Error fetching membership benefits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership benefits',
      error: (error as Error).message
    });
  }
};

export const getMembershipBenefitById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const benefit = await membershipRepo.findBenefitById(id);

    if (!benefit) {
      res.status(404).json({
        success: false,
        message: `Membership benefit with ID ${id} not found`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: benefit
    });
  } catch (error) {
    console.error('Error fetching membership benefit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership benefit',
      error: (error as Error).message
    });
  }
};

export const createMembershipBenefit = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      tierIds: [tierId],
      benefitType,
      discountPercentage,
      discountAmount,
      isActive = true
    } = req.body;

    // Basic validation
    if (!name || !tierId || !benefitType) {
      res.status(400).json({
        success: false,
        message: 'Name, tierId, and benefitType are required'
      });
      return;
    }

    // Check if tier exists
    const tier = await membershipRepo.findTierById(tierId);
    if (!tier) {
      res.status(404).json({
        success: false,
        message: `Membership tier with ID ${tierId} not found`
      });
      return;
    }

    const benefit = await membershipRepo.createBenefit({
      name,
      description,
      tierIds: [tierId],
      benefitType,
      discountPercentage,
      discountAmount,
      isActive
    });

    res.status(201).json({
      success: true,
      data: benefit,
      message: 'Membership benefit created successfully'
    });
  } catch (error) {
    console.error('Error creating membership benefit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create membership benefit',
      error: (error as Error).message
    });
  }
};

export const updateMembershipBenefit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      tierIds: [tierId],
      benefitType,
      discountPercentage,
      discountAmount,
      isActive
    } = req.body;

    // Check if benefit exists
    const existingBenefit = await membershipRepo.findBenefitById(id);
    if (!existingBenefit) {
      res.status(404).json({
        success: false,
        message: `Membership benefit with ID ${id} not found`
      });
      return;
    }

    // If tier ID is changing, verify that the new tier exists
    if (tierId && !existingBenefit.tierIds.includes(tierId)) {
      const tier = await membershipRepo.findTierById(tierId);
      if (!tier) {
        res.status(404).json({
          success: false,
          message: `Membership tier with ID ${tierId} not found`
        });
        return;
      }
    }

    const updatedBenefit = await membershipRepo.updateBenefit(id, {
      name,
      description,
      tierIds: tierId ? [tierId] : undefined,
      benefitType,
      discountPercentage,
      discountAmount,
      isActive
    });

    res.status(200).json({
      success: true,
      data: updatedBenefit,
      message: 'Membership benefit updated successfully'
    });
  } catch (error) {
    console.error('Error updating membership benefit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update membership benefit',
      error: (error as Error).message
    });
  }
};

export const deleteMembershipBenefit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if benefit exists
    const existingBenefit = await membershipRepo.findBenefitById(id);
    if (!existingBenefit) {
      res.status(404).json({
        success: false,
        message: `Membership benefit with ID ${id} not found`
      });
      return;
    }

    await membershipRepo.deleteBenefit(id);

    res.status(200).json({
      success: true,
      message: 'Membership benefit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting membership benefit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete membership benefit',
      error: (error as Error).message
    });
  }
};

// User Membership Endpoints
export const getUserMemberships = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tierId, active } = req.query;
    
    let memberships;
    const isActive = active === 'true';
    if (tierId) {
      memberships = await membershipRepo.findAllUserMemberships(50, 0, { tierId: tierId as string, isActive: isActive });
    } else if (active) {
      memberships = await membershipRepo.findAllUserMemberships(50, 0, { isActive });
    } else {
      memberships = await membershipRepo.findAllUserMemberships(50, 0);
    }

    res.status(200).json({
      success: true,
      data: memberships
    });
  } catch (error) {
    console.error('Error fetching user memberships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user memberships',
      error: (error as Error).message
    });
  }
};

export const getUserMembershipById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const membership = await membershipRepo.findUserMembershipById(id);

    if (!membership) {
      res.status(404).json({
        success: false,
        message: `User membership with ID ${id} not found`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: membership
    });
  } catch (error) {
    console.error('Error fetching user membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user membership',
      error: (error as Error).message
    });
  }
};

export const getUserMembershipByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const membership = await membershipRepo.findMembershipByUserId(userId);

    if (!membership) {
      res.status(404).json({
        success: false,
        message: `User membership for user with ID ${userId} not found`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: membership
    });
  } catch (error) {
    console.error('Error fetching user membership by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user membership',
      error: (error as Error).message
    });
  }
};

export const createUserMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      tierId,
      startDate = new Date(),
      endDate,
      isActive = true,
      autoRenew = false,
      membershipType = 'monthly',
      lastRenewalDate,
      nextRenewalDate,
      paymentMethod
    } = req.body;

    // Basic validation
    if (!userId || !tierId) {
      res.status(400).json({
        success: false,
        message: 'User ID and Tier ID are required'
      });
      return;
    }

    // Check if user already has an active membership
    const existingMembership = await membershipRepo.findMembershipByUserId(userId);
    if (existingMembership && existingMembership.isActive) {
      res.status(400).json({
        success: false,
        message: `User with ID ${userId} already has an active membership`
      });
      return;
    }

    // Check if tier exists
    const tier = await membershipRepo.findTierById(tierId);
    if (!tier) {
      res.status(404).json({
        success: false,
        message: `Membership tier with ID ${tierId} not found`
      });
      return;
    }

    const membership = await membershipRepo.createUserMembership({
      userId,
      tierId,
      startDate,
      endDate,
      isActive,
      autoRenew,
      membershipType,
      lastRenewalDate,
      nextRenewalDate,
      paymentMethod
    });

    res.status(201).json({
      success: true,
      data: membership,
      message: 'User membership created successfully'
    });
  } catch (error) {
    console.error('Error creating user membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user membership',
      error: (error as Error).message
    });
  }
};

export const updateUserMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      tierId,
      startDate,
      endDate,
      isActive,
      autoRenew,
      membershipType,
      lastRenewalDate,
      nextRenewalDate,
      paymentMethod
    } = req.body;

    // Check if membership exists
    const existingMembership = await membershipRepo.findUserMembershipById(id);
    if (!existingMembership) {
      res.status(404).json({
        success: false,
        message: `User membership with ID ${id} not found`
      });
      return;
    }

    // If tier is being updated, verify that the new tier exists
    if (tierId && tierId !== existingMembership.tierId) {
      const tier = await membershipRepo.findTierById(tierId);
      if (!tier) {
        res.status(404).json({
          success: false,
          message: `Membership tier with ID ${tierId} not found`
        });
        return;
      }
    }

    const updatedMembership = await membershipRepo.updateUserMembership(id, {
      tierId,
      startDate,
      endDate,
      isActive,
      autoRenew,
      membershipType,
      lastRenewalDate,
      nextRenewalDate,
      paymentMethod
    });

    res.status(200).json({
      success: true,
      data: updatedMembership,
      message: 'User membership updated successfully'
    });
  } catch (error) {
    console.error('Error updating user membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user membership',
      error: (error as Error).message
    });
  }
};

export const cancelUserMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if membership exists
    const existingMembership = await membershipRepo.findUserMembershipById(id);
    if (!existingMembership) {
      res.status(404).json({
        success: false,
        message: `User membership with ID ${id} not found`
      });
      return;
    }

    const cancelledMembership = await membershipRepo.cancelUserMembership(id);

    res.status(200).json({
      success: true,
      data: cancelledMembership,
      message: 'User membership cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling user membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel user membership',
      error: (error as Error).message
    });
  }
};

export const getUserMembershipBenefits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const benefits = await membershipRepo.getUserMembershipBenefits(userId);

    res.status(200).json({
      success: true,
      data: benefits
    });
  } catch (error) {
    console.error('Error fetching user membership benefits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user membership benefits',
      error: (error as Error).message
    });
  }
};

// Export all controllers as a single object for backward compatibility
export default {
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
};
