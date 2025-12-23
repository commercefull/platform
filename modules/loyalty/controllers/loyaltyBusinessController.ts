/**
 * Loyalty Business Controller
 * 
 * Handles business/admin endpoints for loyalty management.
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import loyaltyRepo, { LoyaltyPointsAction } from '../repos/loyaltyRepo';

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

// ============================================================================
// Tier Management
// ============================================================================

export const getTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const tiers = await loyaltyRepo.findAllTiers(includeInactive);
    respond(res, tiers);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to fetch loyalty tiers');
  }
};

export const getTierById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tier = await loyaltyRepo.findTierById(id);

    if (!tier) {
      respondError(res, `Loyalty tier with ID ${id} not found`, 404);
      return;
    }

    respond(res, tier);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to fetch loyalty tier');
  }
};

export const createTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, type, pointsThreshold, multiplier, benefits, isActive } = req.body;

    if (!name || pointsThreshold === undefined || multiplier === undefined) {
      respondError(res, 'Name, pointsThreshold, and multiplier are required', 400);
      return;
    }

    const tier = await loyaltyRepo.createTier({
      name,
      description,
      type: type || 'points',
      pointsThreshold,
      multiplier,
      benefits,
      isActive
    });

    respondWithMessage(res, tier, 'Loyalty tier created successfully', 201);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to create loyalty tier');
  }
};

export const updateTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, type, pointsThreshold, multiplier, benefits, isActive } = req.body;

    const tier = await loyaltyRepo.updateTier(id, {
      name,
      description,
      type,
      pointsThreshold,
      multiplier,
      benefits,
      isActive
    });

    respondWithMessage(res, tier, 'Loyalty tier updated successfully');
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to update loyalty tier');
  }
};

// ============================================================================
// Reward Management
// ============================================================================

export const getRewards = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const rewards = await loyaltyRepo.findAllRewards(includeInactive);
    respond(res, rewards);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to fetch loyalty rewards');
  }
};

export const getRewardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reward = await loyaltyRepo.findRewardById(id);

    if (!reward) {
      respondError(res, `Loyalty reward with ID ${id} not found`, 404);
      return;
    }

    respond(res, reward);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to fetch loyalty reward');
  }
};

export const createReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, description, pointsCost, discountAmount, discountPercent,
      discountCode, freeShipping, productIds, expiresAt, isActive
    } = req.body;

    if (!name || pointsCost === undefined) {
      respondError(res, 'Name and pointsCost are required', 400);
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
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive
    });

    respondWithMessage(res, reward, 'Loyalty reward created successfully', 201);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to create loyalty reward');
  }
};

export const updateReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name, description, pointsCost, discountAmount, discountPercent,
      discountCode, freeShipping, productIds, expiresAt, isActive
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
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive
    });

    respondWithMessage(res, reward, 'Loyalty reward updated successfully');
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to update loyalty reward');
  }
};

// ============================================================================
// Customer Points Management
// ============================================================================

export const getCustomerPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const pointsData = await loyaltyRepo.findCustomerPointsWithTier(customerId);

    if (!pointsData) {
      respondError(res, `No loyalty points found for customer ${customerId}`, 404);
      return;
    }

    respond(res, {
      ...pointsData.points,
      tier: pointsData.tier
    });
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to fetch customer loyalty points');
  }
};

export const getCustomerPointsTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await loyaltyRepo.findCustomerTransactions(customerId, limit);

    res.json({
      success: true,
      data: transactions,
      pagination: { limit }
    });
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to fetch customer loyalty transactions');
  }
};

export const adjustCustomerPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { points, reason, tierId } = req.body;

    if (points === undefined) {
      respondError(res, 'Points adjustment amount is required', 400);
      return;
    }

    // If tierId provided and customer has no points, initialize first
    if (tierId) {
      const existing = await loyaltyRepo.findCustomerPoints(customerId);
      if (!existing) {
        await loyaltyRepo.initializeCustomerPoints(customerId, tierId);
      }
    }

    const updatedPoints = await loyaltyRepo.adjustCustomerPoints(
      customerId,
      parseInt(points),
      LoyaltyPointsAction.MANUAL_ADJUSTMENT,
      reason || 'Manual adjustment by admin'
    );

    respondWithMessage(
      res, 
      updatedPoints, 
      `Customer points ${points >= 0 ? 'increased' : 'decreased'} successfully`
    );
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to adjust customer loyalty points');
  }
};

// ============================================================================
// Redemption Management
// ============================================================================

export const getCustomerRedemptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const redemptions = await loyaltyRepo.findCustomerRedemptions(customerId, limit);
    respond(res, redemptions);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to fetch customer redemptions');
  }
};

export const updateRedemptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'used', 'expired', 'cancelled'].includes(status)) {
      respondError(res, 'Valid status (pending, used, expired, or cancelled) is required', 400);
      return;
    }

    const redemption = await loyaltyRepo.updateRedemptionStatus(
      id,
      status as 'pending' | 'used' | 'expired' | 'cancelled'
    );

    respondWithMessage(res, redemption, `Redemption status updated to ${status}`);
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to update redemption status');
  }
};

// ============================================================================
// Order Processing
// ============================================================================

export const processOrderPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { orderAmount, customerId } = req.body;

    if (!orderAmount || !customerId) {
      respondError(res, 'Order amount and customer ID are required', 400);
      return;
    }

    const updatedPoints = await loyaltyRepo.processOrderPoints(
      customerId,
      orderId,
      parseFloat(orderAmount)
    );

    respondWithMessage(res, updatedPoints, 'Order points processed successfully');
  } catch (error) {
    logger.error('Error:', error);
    
    respondError(res, 'Failed to process order points');
  }
};
