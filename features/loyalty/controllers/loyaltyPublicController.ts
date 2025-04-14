import { Request, Response } from 'express';
import { LoyaltyRepo } from '../repos/loyaltyRepo';

export class LoyaltyPublicController {
  private loyaltyRepo: LoyaltyRepo;

  constructor() {
    this.loyaltyRepo = new LoyaltyRepo();
  }

  // Get publicly available loyalty tiers
  getPublicTiers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only get active tiers for public API
      const tiers = await this.loyaltyRepo.findAllTiers(false);

      // Return limited tier information for public view
      const publicTiers = tiers.map(tier => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        pointsThreshold: tier.pointsThreshold,
        benefits: tier.benefits
      }));

      res.status(200).json({
        success: true,
        data: publicTiers
      });
    } catch (error) {
      console.error('Error fetching public loyalty tiers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty tiers',
        error: (error as Error).message
      });
    }
  };

  // Get publicly available loyalty rewards
  getPublicRewards = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only get active rewards for public API
      const rewards = await this.loyaltyRepo.findAllRewards(false);

      // Return limited reward information for public view
      const publicRewards = rewards.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        pointsCost: reward.pointsCost,
        freeShipping: reward.freeShipping,
        expiresAt: reward.expiresAt
      }));

      res.status(200).json({
        success: true,
        data: publicRewards
      });
    } catch (error) {
      console.error('Error fetching public loyalty rewards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty rewards',
        error: (error as Error).message
      });
    }
  };

  // Get customer's loyalty status and points
  getMyLoyaltyStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // Customer ID would come from authenticated user session
      const customerId = req.user?.id;

      if (!customerId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const points = await this.loyaltyRepo.findCustomerPoints(customerId);

      if (!points) {
        // Return default values for new customers
        res.status(200).json({
          success: true,
          data: {
            currentPoints: 0,
            lifetimePoints: 0,
            tier: {
              name: 'Not Enrolled',
              description: 'Enroll in our loyalty program to start earning points',
              pointsThreshold: 0
            }
          }
        });
        return;
      }

      // Get the customer's tier
      const tier = await this.loyaltyRepo.findTierById(points.tierId);

      // Return customer-friendly response
      res.status(200).json({
        success: true,
        data: {
          currentPoints: points.currentPoints,
          lifetimePoints: points.lifetimePoints,
          lastActivity: points.lastActivity,
          expiryDate: points.expiryDate,
          tier: tier ? {
            name: tier.name,
            description: tier.description,
            pointsThreshold: tier.pointsThreshold,
            benefits: tier.benefits
          } : undefined,
          pointsToNextTier: tier ? this.calculatePointsToNextTier(points.lifetimePoints, tier) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching customer loyalty status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty status',
        error: (error as Error).message
      });
    }
  };

  // Get customer's loyalty transaction history
  getMyTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      // Customer ID would come from authenticated user session
      const customerId = req.user?.id;

      if (!customerId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await this.loyaltyRepo.getCustomerTransactions(customerId, limit, offset);

      // Format transactions for customer view
      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        action: transaction.action,
        points: transaction.points,
        description: transaction.description,
        date: transaction.createdAt
      }));

      res.status(200).json({
        success: true,
        data: formattedTransactions,
        pagination: {
          limit,
          offset
        }
      });
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loyalty transactions',
        error: (error as Error).message
      });
    }
  };

  // Redeem points for a reward
  redeemReward = async (req: Request, res: Response): Promise<void> => {
    try {
      // Customer ID would come from authenticated user session
      const customerId = req.user?.id;

      if (!customerId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { rewardId } = req.body;

      if (!rewardId) {
        res.status(400).json({
          success: false,
          message: 'Reward ID is required'
        });
        return;
      }

      const redemption = await this.loyaltyRepo.redeemReward(customerId, rewardId);

      res.status(200).json({
        success: true,
        data: {
          redemptionCode: redemption.redemptionCode,
          pointsSpent: redemption.pointsSpent,
          expiresAt: redemption.expiresAt
        },
        message: 'Reward redeemed successfully'
      });
    } catch (error) {
      console.error('Error redeeming reward:', error);
      
      // Provide friendly error messages for common issues
      if ((error as Error).message.includes('Insufficient points')) {
        res.status(400).json({
          success: false,
          message: (error as Error).message
        });
      } else if ((error as Error).message.includes('not active')) {
        res.status(400).json({
          success: false,
          message: 'This reward is no longer available'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to redeem reward',
          error: (error as Error).message
        });
      }
    }
  };

  // Get my active redemptions
  getMyRedemptions = async (req: Request, res: Response): Promise<void> => {
    try {
      // Customer ID would come from authenticated user session
      const customerId = req.user?.id;

      if (!customerId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Default to only active (pending) redemptions
      const status = req.query.status as string || 'pending';
      
      const redemptions = await this.loyaltyRepo.getCustomerRedemptions(customerId, status);

      // Add reward details to each redemption
      const detailedRedemptions = await Promise.all(
        redemptions.map(async (redemption) => {
          const reward = await this.loyaltyRepo.findRewardById(redemption.rewardId);
          return {
            id: redemption.id,
            redemptionCode: redemption.redemptionCode,
            pointsSpent: redemption.pointsSpent,
            status: redemption.status,
            createdAt: redemption.createdAt,
            expiresAt: redemption.expiresAt,
            reward: reward ? {
              name: reward.name,
              description: reward.description
            } : undefined
          };
        })
      );

      res.status(200).json({
        success: true,
        data: detailedRedemptions
      });
    } catch (error) {
      console.error('Error fetching customer redemptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch redemptions',
        error: (error as Error).message
      });
    }
  };

  // Helper method to calculate points needed for the next tier
  private calculatePointsToNextTier = (currentLifetimePoints: number, currentTier: any): number => {
    try {
      // This would need to be implemented based on the tiers in the system
      // For now, a simplified version that assumes tiers are ordered
      return 0; // Placeholder
    } catch (error) {
      console.error('Error calculating points to next tier:', error);
      return 0;
    }
  };
}
