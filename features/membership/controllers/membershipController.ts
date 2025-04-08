import { Request, Response } from 'express';
import { 
  MembershipRepo, 
  MembershipTier, 
  MembershipBenefit, 
  UserMembership 
} from '../repos/membershipRepo';

export class MembershipController {
  private membershipRepo: MembershipRepo;

  constructor() {
    this.membershipRepo = new MembershipRepo();
  }

  // Membership Tier Endpoints
  getMembershipTiers = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const tiers = await this.membershipRepo.findAllTiers(includeInactive);

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

  getMembershipTierById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tier = await this.membershipRepo.findTierById(id);

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

  createMembershipTier = async (req: Request, res: Response): Promise<void> => {
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

      const tier = await this.membershipRepo.createTier({
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

  updateMembershipTier = async (req: Request, res: Response): Promise<void> => {
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
      const existingTier = await this.membershipRepo.findTierById(id);
      if (!existingTier) {
        res.status(404).json({
          success: false,
          message: `Membership tier with ID ${id} not found`
        });
        return;
      }

      const updatedTier = await this.membershipRepo.updateTier(id, {
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

  deleteMembershipTier = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if tier exists
      const existingTier = await this.membershipRepo.findTierById(id);
      if (!existingTier) {
        res.status(404).json({
          success: false,
          message: `Membership tier with ID ${id} not found`
        });
        return;
      }

      const deleted = await this.membershipRepo.deleteTier(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Membership tier deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete membership tier'
        });
      }
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
  getMembershipBenefits = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const tierId = req.query.tierId as string | undefined;
      
      let benefits: MembershipBenefit[];
      
      if (tierId) {
        benefits = await this.membershipRepo.findBenefitsByTierId(tierId);
      } else {
        benefits = await this.membershipRepo.findAllBenefits(includeInactive);
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

  getMembershipBenefitById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const benefit = await this.membershipRepo.findBenefitById(id);

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

  createMembershipBenefit = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        tierIds,
        name,
        description,
        benefitType,
        discountPercentage,
        discountAmount,
        isActive = true
      } = req.body;

      // Basic validation
      if (!name || !tierIds || !Array.isArray(tierIds) || tierIds.length === 0 || !benefitType) {
        res.status(400).json({
          success: false,
          message: 'Name, tierIds array, and benefitType are required'
        });
        return;
      }

      // Validate discount fields based on benefit type
      if (benefitType === 'discount' && !discountPercentage && !discountAmount) {
        res.status(400).json({
          success: false,
          message: 'Discount benefits require either discountPercentage or discountAmount'
        });
        return;
      }

      const benefit = await this.membershipRepo.createBenefit({
        tierIds,
        name,
        description,
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

  updateMembershipBenefit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        tierIds,
        name,
        description,
        benefitType,
        discountPercentage,
        discountAmount,
        isActive
      } = req.body;

      // Check if benefit exists
      const existingBenefit = await this.membershipRepo.findBenefitById(id);
      if (!existingBenefit) {
        res.status(404).json({
          success: false,
          message: `Membership benefit with ID ${id} not found`
        });
        return;
      }

      const updatedBenefit = await this.membershipRepo.updateBenefit(id, {
        tierIds,
        name,
        description,
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

  deleteMembershipBenefit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if benefit exists
      const existingBenefit = await this.membershipRepo.findBenefitById(id);
      if (!existingBenefit) {
        res.status(404).json({
          success: false,
          message: `Membership benefit with ID ${id} not found`
        });
        return;
      }

      const deleted = await this.membershipRepo.deleteBenefit(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Membership benefit deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete membership benefit'
        });
      }
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
  getUserMemberships = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const isActive = req.query.isActive === 'true' ? true : 
                      req.query.isActive === 'false' ? false : 
                      undefined;
      const tierId = req.query.tierId as string | undefined;
      
      const filter = {
        isActive,
        tierId
      };
      
      const memberships = await this.membershipRepo.findAllUserMemberships(limit, offset, filter);

      res.status(200).json({
        success: true,
        data: memberships,
        pagination: {
          limit,
          offset
        }
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

  getUserMembershipById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeTier = req.query.includeTier === 'true';
      
      let membership;
      
      if (includeTier) {
        membership = await this.membershipRepo.findUserMembershipWithTier(id);
      } else {
        membership = await this.membershipRepo.findUserMembershipById(id);
      }

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

  getUserMembershipByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const includeTier = req.query.includeTier === 'true';
      
      let membership;
      
      if (includeTier) {
        membership = await this.membershipRepo.findMembershipByUserIdWithTier(userId);
      } else {
        membership = await this.membershipRepo.findMembershipByUserId(userId);
      }

      if (!membership) {
        res.status(404).json({
          success: false,
          message: `Active membership for user with ID ${userId} not found`
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

  createUserMembership = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        userId,
        tierId,
        startDate,
        endDate,
        isActive = true,
        autoRenew = true,
        membershipType,
        lastRenewalDate,
        nextRenewalDate,
        paymentMethod
      } = req.body;

      // Basic validation
      if (!userId || !tierId || !startDate || !endDate || !membershipType) {
        res.status(400).json({
          success: false,
          message: 'userId, tierId, startDate, endDate, and membershipType are required'
        });
        return;
      }

      // Verify that the tier exists
      const tier = await this.membershipRepo.findTierById(tierId);
      if (!tier) {
        res.status(404).json({
          success: false,
          message: `Membership tier with ID ${tierId} not found`
        });
        return;
      }

      const membership = await this.membershipRepo.createUserMembership({
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

  updateUserMembership = async (req: Request, res: Response): Promise<void> => {
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
      const existingMembership = await this.membershipRepo.findUserMembershipById(id);
      if (!existingMembership) {
        res.status(404).json({
          success: false,
          message: `User membership with ID ${id} not found`
        });
        return;
      }

      // If tier is being updated, verify that the new tier exists
      if (tierId && tierId !== existingMembership.tierId) {
        const tier = await this.membershipRepo.findTierById(tierId);
        if (!tier) {
          res.status(404).json({
            success: false,
            message: `Membership tier with ID ${tierId} not found`
          });
          return;
        }
      }

      const updatedMembership = await this.membershipRepo.updateUserMembership(id, {
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

  cancelUserMembership = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if membership exists
      const existingMembership = await this.membershipRepo.findUserMembershipById(id);
      if (!existingMembership) {
        res.status(404).json({
          success: false,
          message: `User membership with ID ${id} not found`
        });
        return;
      }

      const cancelledMembership = await this.membershipRepo.cancelUserMembership(id);

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

  getUserMembershipBenefits = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const benefits = await this.membershipRepo.getUserMembershipBenefits(userId);

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
}
