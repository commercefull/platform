/**
 * Loyalty Customer Controller
 *
 * Handles public and customer-facing loyalty endpoints.
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import loyaltyRepo from '../repos/loyaltyRepo';

// ============================================================================
// Types
// ============================================================================

interface UserRequest extends Request {
  user?: {
    id?: string;
    customerId?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function respond(res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondWithMessage(res: Response, data: unknown, message: string, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data, message });
}

function respondError(res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, message });
}

function getCustomerId(req: UserRequest): string | null {
  return req.user?.customerId || req.user?.id || null;
}

// ============================================================================
// Public Endpoints
// ============================================================================

/**
 * Get publicly available loyalty tiers
 */
export const getPublicTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    const tiers = await loyaltyRepo.findAllTiers(false);

    // Return limited tier information for public view
    const publicTiers = tiers.map(tier => ({
      id: tier.loyaltyTierId,
      name: tier.name,
      description: tier.description,
      pointsThreshold: tier.pointsThreshold,
      benefits: tier.benefits,
    }));

    respond(res, publicTiers);
  } catch (error) {
    logger.error('Error:', error);

    respondError(res, 'Failed to fetch loyalty tiers');
  }
};

/**
 * Get publicly available loyalty rewards
 */
export const getPublicRewards = async (req: Request, res: Response): Promise<void> => {
  try {
    const rewards = await loyaltyRepo.findAllRewards(false);

    // Return limited reward information for public view
    const publicRewards = rewards.map(reward => ({
      id: reward.loyaltyRewardId,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      freeShipping: reward.freeShipping,
      expiresAt: reward.expiresAt,
    }));

    respond(res, publicRewards);
  } catch (error) {
    logger.error('Error:', error);

    respondError(res, 'Failed to fetch loyalty rewards');
  }
};

// ============================================================================
// Authenticated Customer Endpoints
// ============================================================================

/**
 * Get customer's loyalty status and points
 */
export const getMyLoyaltyStatus = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      respondError(res, 'Authentication required', 401);
      return;
    }

    const pointsData = await loyaltyRepo.findCustomerPointsWithTier(customerId);

    if (!pointsData) {
      // Return default values for new customers
      respond(res, {
        currentPoints: 0,
        lifetimePoints: 0,
        tier: {
          name: 'Not Enrolled',
          description: 'Enroll in our loyalty program to start earning points',
          pointsThreshold: 0,
        },
      });
      return;
    }

    const { points, tier } = pointsData;

    respond(res, {
      currentPoints: points.currentPoints,
      lifetimePoints: points.lifetimePoints,
      lastActivity: points.lastActivity,
      expiryDate: points.expiryDate,
      tier: {
        name: tier.name,
        description: tier.description,
        pointsThreshold: tier.pointsThreshold,
        benefits: tier.benefits,
      },
    });
  } catch (error) {
    logger.error('Error:', error);

    respondError(res, 'Failed to fetch loyalty status');
  }
};

/**
 * Get my loyalty transactions
 */
export const getMyTransactions = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      respondError(res, 'Authentication required', 401);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const transactions = await loyaltyRepo.findCustomerTransactions(customerId, limit);

    // Format transactions for customer view
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.loyaltyTransactionId,
      action: transaction.action,
      points: transaction.points,
      description: transaction.description,
      date: transaction.createdAt,
    }));

    res.json({
      success: true,
      data: formattedTransactions,
      pagination: { limit },
    });
  } catch (error) {
    logger.error('Error:', error);

    respondError(res, 'Failed to fetch loyalty transactions');
  }
};

/**
 * Redeem points for a reward
 */
export const redeemReward = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      respondError(res, 'Authentication required', 401);
      return;
    }

    const { rewardId } = req.body;

    if (!rewardId) {
      respondError(res, 'Reward ID is required', 400);
      return;
    }

    const redemption = await loyaltyRepo.redeemReward(customerId, rewardId);

    respondWithMessage(
      res,
      {
        redemptionCode: redemption.redemptionCode,
        pointsSpent: redemption.pointsSpent,
        expiresAt: redemption.expiresAt,
      },
      'Reward redeemed successfully',
    );
  } catch (error) {
    logger.error('Error:', error);

    const errorMessage = (error as Error).message;

    if (errorMessage.includes('Insufficient points')) {
      respondError(res, errorMessage, 400);
    } else if (errorMessage.includes('not active')) {
      respondError(res, 'This reward is no longer available', 400);
    } else {
      respondError(res, 'Failed to redeem reward');
    }
  }
};

/**
 * Get my active redemptions
 */
export const getMyRedemptions = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      respondError(res, 'Authentication required', 401);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const redemptions = await loyaltyRepo.findCustomerRedemptions(customerId, limit);

    // Add reward details to each redemption
    const detailedRedemptions = await Promise.all(
      redemptions.map(async redemption => {
        const reward = await loyaltyRepo.findRewardById(redemption.rewardId);
        return {
          id: redemption.loyaltyRedemptionId,
          redemptionCode: redemption.redemptionCode,
          pointsSpent: redemption.pointsSpent,
          status: redemption.status,
          createdAt: redemption.createdAt,
          expiresAt: redemption.expiresAt,
          reward: reward
            ? {
                name: reward.name,
                description: reward.description,
              }
            : undefined,
        };
      }),
    );

    respond(res, detailedRedemptions);
  } catch (error) {
    logger.error('Error:', error);

    respondError(res, 'Failed to fetch redemptions');
  }
};
