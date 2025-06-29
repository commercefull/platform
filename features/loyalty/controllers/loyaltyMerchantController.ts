import { Request, Response } from 'express';
import { LoyaltyRepo, LoyaltyTier, LoyaltyPointsAction, LoyaltyReward } from '../repos/loyaltyRepo';

// Create a single instance of the repository to be shared across handlers
const loyaltyRepo = new LoyaltyRepo();

// Tier Management
export const getTiers = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const tiers = await loyaltyRepo.findAllTiers(includeInactive);

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

export const getTierById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tier = await loyaltyRepo.findTierById(id);

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

export const createTier = async (req: Request, res: Response): Promise<void> => {
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

      const tier = await loyaltyRepo.createTier({
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

export const updateTier = async (req: Request, res: Response): Promise<void> => {
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

      const tier = await loyaltyRepo.updateTier(id, {
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
export const getRewards = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const rewards = await loyaltyRepo.findAllRewards(includeInactive);

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

export const getRewardById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reward = await loyaltyRepo.findRewardById(id);

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

export const createReward = async (req: Request, res: Response): Promise<void> => {
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

      const reward = await loyaltyRepo.createReward({
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

export const updateReward = async (req: Request, res: Response): Promise<void> => {
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

      const reward = await loyaltyRepo.updateReward(id, {
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

// Customer Points Management
export const getCustomerPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const customerPoints = await loyaltyRepo.findCustomerPoints(customerId);

    if (!customerPoints) {
      res.status(404).json({
        success: false,
        message: `No loyalty points found for customer ${customerId}`
      });
      return;
    }

    // Get the customer's tier
    const tier = await loyaltyRepo.findTierById(customerPoints.tierId);

    res.status(200).json({
      success: true,
      data: {
        ...customerPoints,
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

export const getCustomerPointsTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const action = req.query.action as string | undefined;

    const transactions = await loyaltyRepo.getCustomerTransactions(
      customerId, 
      limit, 
      offset
    );

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

export const adjustCustomerPoints = async (req: Request, res: Response): Promise<void> => {
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

      const updatedPoints = await loyaltyRepo.addPoints(
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
export const getCustomerRedemptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const status = req.query.status as string | undefined;

      const redemptions = await loyaltyRepo.getCustomerRedemptions(customerId, status);

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

export const updateRedemptionStatus = async (req: Request, res: Response): Promise<void> => {
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

      const redemption = await loyaltyRepo.updateRedemptionStatus(
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
export const processOrderPoints = async (req: Request, res: Response): Promise<void> => {
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

      const updatedPoints = await loyaltyRepo.processOrderPoints(
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

// Export all controllers as a single object for backward compatibility
export default {
  getTiers,
  getTierById,
  createTier,
  updateTier,
  getRewards,
  getRewardById,
  createReward,
  updateReward,
  getCustomerPoints,
  getCustomerPointsTransactions,
  adjustCustomerPoints,
  getCustomerRedemptions,
  updateRedemptionStatus,
  processOrderPoints
};
