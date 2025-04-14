import { Request, Response } from 'express';
import { LoyaltyRepo, LoyaltyTier, LoyaltyPointsAction, LoyaltyReward } from '../repos/loyaltyRepo';

export class LoyaltyController {
  private loyaltyRepo: LoyaltyRepo;

  constructor() {
    this.loyaltyRepo = new LoyaltyRepo();
  }

  // Tier Management
  getTiers = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const tiers = await this.loyaltyRepo.findAllTiers(includeInactive);

      res.status(200).json({
        success: true,
        data: tiers
      });
    } catch (error) {
      console.error('Error fetching loyalty tiers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty tiers',
        error: (error as Error).message
      });
    }
  };

  getTierById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tier = await this.loyaltyRepo.findTierById(id);

      if (!tier) {
        res.status(404).json({
          success: false,
          message: `Loyalty tier with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tier
      });
    } catch (error) {
      console.error('Error fetching loyalty tier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty tier',
        error: (error as Error).message
      });
    }
  };

  createTier = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        type,
        pointsThreshold,
        multiplier,
        benefits,
        isActive = true
      } = req.body;

      // Validate inputs
      if (!name || pointsThreshold === undefined || multiplier === undefined) {
        res.status(400).json({
          success: false,
          message: 'Name, pointsThreshold, and multiplier are required'
        });
        return;
      }

      const tier = await this.loyaltyRepo.createTier({
        name,
        description,
        type,
        pointsThreshold,
        multiplier,
        benefits,
        isActive
      });

      res.status(201).json({
        success: true,
        data: tier,
        message: 'Loyalty tier created successfully'
      });
    } catch (error) {
      console.error('Error creating loyalty tier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create loyalty tier',
        error: (error as Error).message
      });
    }
  };

  updateTier = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        type,
        pointsThreshold,
        multiplier,
        benefits,
        isActive
      } = req.body;

      const tier = await this.loyaltyRepo.updateTier(id, {
        name,
        description,
        type,
        pointsThreshold,
        multiplier,
        benefits,
        isActive
      });

      res.status(200).json({
        success: true,
        data: tier,
        message: 'Loyalty tier updated successfully'
      });
    } catch (error) {
      console.error('Error updating loyalty tier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update loyalty tier',
        error: (error as Error).message
      });
    }
  };

  // Rewards Management
  getRewards = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const rewards = await this.loyaltyRepo.findAllRewards(includeInactive);

      res.status(200).json({
        success: true,
        data: rewards
      });
    } catch (error) {
      console.error('Error fetching loyalty rewards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty rewards',
        error: (error as Error).message
      });
    }
  };

  getRewardById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reward = await this.loyaltyRepo.findRewardById(id);

      if (!reward) {
        res.status(404).json({
          success: false,
          message: `Loyalty reward with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: reward
      });
    } catch (error) {
      console.error('Error fetching loyalty reward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty reward',
        error: (error as Error).message
      });
    }
  };

  createReward = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        pointsCost,
        discountAmount,
        discountPercent,
        discountCode,
        freeShipping = false,
        productIds,
        expiresAt,
        isActive = true
      } = req.body;

      // Validate inputs
      if (!name || pointsCost === undefined) {
        res.status(400).json({
          success: false,
          message: 'Name and pointsCost are required'
        });
        return;
      }

      const reward = await this.loyaltyRepo.createReward({
        name,
        description,
        pointsCost,
        discountAmount,
        discountPercent,
        discountCode,
        freeShipping,
        productIds,
        expiresAt,
        isActive
      });

      res.status(201).json({
        success: true,
        data: reward,
        message: 'Loyalty reward created successfully'
      });
    } catch (error) {
      console.error('Error creating loyalty reward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create loyalty reward',
        error: (error as Error).message
      });
    }
  };

  updateReward = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        pointsCost,
        discountAmount,
        discountPercent,
        discountCode,
        freeShipping,
        productIds,
        expiresAt,
        isActive
      } = req.body;

      const reward = await this.loyaltyRepo.updateReward(id, {
        name,
        description,
        pointsCost,
        discountAmount,
        discountPercent,
        discountCode,
        freeShipping,
        productIds,
        expiresAt,
        isActive
      });

      res.status(200).json({
        success: true,
        data: reward,
        message: 'Loyalty reward updated successfully'
      });
    } catch (error) {
      console.error('Error updating loyalty reward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update loyalty reward',
        error: (error as Error).message
      });
    }
  };

  // Customer Management
  getCustomerPoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const points = await this.loyaltyRepo.findCustomerPoints(customerId);

      if (!points) {
        res.status(404).json({
          success: false,
          message: `No loyalty points found for customer ${customerId}`
        });
        return;
      }

      // Get the customer's tier
      const tier = await this.loyaltyRepo.findTierById(points.tierId);

      res.status(200).json({
        success: true,
        data: {
          ...points,
          tier: tier || undefined
        }
      });
    } catch (error) {
      console.error('Error fetching customer loyalty points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer loyalty points',
        error: (error as Error).message
      });
    }
  };

  getCustomerTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await this.loyaltyRepo.getCustomerTransactions(customerId, limit, offset);

      res.status(200).json({
        success: true,
        data: transactions,
        pagination: {
          limit,
          offset
        }
      });
    } catch (error) {
      console.error('Error fetching customer loyalty transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer loyalty transactions',
        error: (error as Error).message
      });
    }
  };

  adjustCustomerPoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const { points, reason } = req.body;

      if (points === undefined) {
        res.status(400).json({
          success: false,
          message: 'Points adjustment amount is required'
        });
        return;
      }

      const updatedPoints = await this.loyaltyRepo.addPoints(
        customerId,
        parseInt(points),
        LoyaltyPointsAction.MANUAL_ADJUSTMENT,
        undefined,
        reason || 'Manual adjustment by admin'
      );

      res.status(200).json({
        success: true,
        data: updatedPoints,
        message: `Customer points ${points >= 0 ? 'increased' : 'decreased'} successfully`
      });
    } catch (error) {
      console.error('Error adjusting customer loyalty points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to adjust customer loyalty points',
        error: (error as Error).message
      });
    }
  };

  // Redemption Management
  getCustomerRedemptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const status = req.query.status as string | undefined;

      const redemptions = await this.loyaltyRepo.getCustomerRedemptions(customerId, status);

      res.status(200).json({
        success: true,
        data: redemptions
      });
    } catch (error) {
      console.error('Error fetching customer redemptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer redemptions',
        error: (error as Error).message
      });
    }
  };

  updateRedemptionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['used', 'expired', 'cancelled'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status (used, expired, or cancelled) is required'
        });
        return;
      }

      const redemption = await this.loyaltyRepo.updateRedemptionStatus(
        id,
        status as 'used' | 'expired' | 'cancelled'
      );

      res.status(200).json({
        success: true,
        data: redemption,
        message: `Redemption status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating redemption status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update redemption status',
        error: (error as Error).message
      });
    }
  };

  // Order Processing
  processOrderPoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { orderAmount, customerId } = req.body;

      if (!orderAmount || !customerId) {
        res.status(400).json({
          success: false,
          message: 'Order amount and customer ID are required'
        });
        return;
      }

      const updatedPoints = await this.loyaltyRepo.processOrderPoints(
        orderId,
        parseFloat(orderAmount),
        customerId
      );

      res.status(200).json({
        success: true,
        data: updatedPoints,
        message: 'Order points processed successfully'
      });
    } catch (error) {
      console.error('Error processing order points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process order points',
        error: (error as Error).message
      });
    }
  };
}
