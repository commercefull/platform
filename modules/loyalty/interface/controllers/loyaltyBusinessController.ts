/**
 * Loyalty Business Controller
 *
 * Handles business/admin endpoints for loyalty management.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import loyaltyDataRepository, { LoyaltyPointsAction } from '../../infrastructure/repositories/LoyaltyDataRepository';

const loyaltyRepo = loyaltyDataRepository.points;

// ============================================================================
// Body Interfaces
// ============================================================================

interface CreateTierBody {
  name: string;
  description?: string;
  type?: string;
  pointsThreshold: number;
  multiplier: number;
  benefits?: unknown[];
  isActive?: boolean;
}

interface UpdateTierBody {
  name?: string;
  description?: string;
  type?: string;
  pointsThreshold?: number;
  multiplier?: number;
  benefits?: unknown[];
  isActive?: boolean;
}

interface CreateRewardBody {
  name: string;
  description?: string;
  pointsCost: number;
  discountAmount?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping?: boolean;
  productIds?: string[];
  expiresAt?: string;
  isActive?: boolean;
}

interface UpdateRewardBody {
  name?: string;
  description?: string;
  pointsCost?: number;
  discountAmount?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping?: boolean;
  productIds?: string[];
  expiresAt?: string;
  isActive?: boolean;
}

interface AdjustPointsBody {
  points: string;
  reason?: string;
  tierId?: string;
}

interface UpdateRedemptionStatusBody {
  status: string;
}

interface ProcessOrderPointsBody {
  orderAmount: string;
  customerId: string;
}

interface _RedeemRewardBody {
  rewardId: string;
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

// ============================================================================
// Tier Management
// ============================================================================

export const getTiers = async (req: TypedRequest, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === 'true';
  const tiers = await loyaltyRepo.findAllTiers(includeInactive);
  respond(res, tiers);
  
};

export const getTierById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const tier = await loyaltyRepo.findTierById(id);

  if (!tier) {
    respondError(res, `Loyalty tier with ID ${id} not found`, 404);
    return;
  }

  respond(res, tier);
  
};

export const createTier = async (req: TypedRequest<Record<string, string>, unknown, CreateTierBody>, res: Response): Promise<void> => {
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
    isActive,
  });

  respondWithMessage(res, tier, 'Loyalty tier created successfully', 201);
  
};

export const updateTier = async (req: TypedRequest<Record<string, string>, unknown, UpdateTierBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, type, pointsThreshold, multiplier, benefits, isActive } = req.body;

  const tier = await loyaltyRepo.updateTier(id, {
    name,
    description,
    type,
    pointsThreshold,
    multiplier,
    benefits,
    isActive,
  });

  respondWithMessage(res, tier, 'Loyalty tier updated successfully');
  
};

// ============================================================================
// Reward Management
// ============================================================================

export const getRewards = async (req: TypedRequest, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === 'true';
  const rewards = await loyaltyRepo.findAllRewards(includeInactive);
  respond(res, rewards);
  
};

export const getRewardById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const reward = await loyaltyRepo.findRewardById(id);

  if (!reward) {
    respondError(res, `Loyalty reward with ID ${id} not found`, 404);
    return;
  }

  respond(res, reward);
  
};

export const createReward = async (req: TypedRequest<Record<string, string>, unknown, CreateRewardBody>, res: Response): Promise<void> => {
  const { name, description, pointsCost, discountAmount, discountPercent, discountCode, freeShipping, productIds, expiresAt, isActive } =
    req.body;

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
    isActive,
  });

  respondWithMessage(res, reward, 'Loyalty reward created successfully', 201);
  
};

export const updateReward = async (req: TypedRequest<Record<string, string>, unknown, UpdateRewardBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, pointsCost, discountAmount, discountPercent, discountCode, freeShipping, productIds, expiresAt, isActive } =
    req.body;

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
    isActive,
  });

  respondWithMessage(res, reward, 'Loyalty reward updated successfully');
  
};

// ============================================================================
// Customer Points Management
// ============================================================================

export const getCustomerPoints = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;
  const pointsData = await loyaltyRepo.findCustomerPointsWithTier(customerId);

  if (!pointsData) {
    respondError(res, `No loyalty points found for customer ${customerId}`, 404);
    return;
  }

  respond(res, {
    ...pointsData.points,
    tier: pointsData.tier,
  });
  
};

export const getCustomerPointsTransactions = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const transactions = await loyaltyRepo.findCustomerTransactions(customerId, limit);

  res.json({
    success: true,
    data: transactions,
    pagination: { limit },
  });
  
};

export const adjustCustomerPoints = async (req: TypedRequest<Record<string, string>, unknown, AdjustPointsBody>, res: Response): Promise<void> => {
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
    reason || 'Manual adjustment by admin',
  );

  respondWithMessage(res, updatedPoints, `Customer points ${parseInt(points) >= 0 ? 'increased' : 'decreased'} successfully`);
  
};

// ============================================================================
// Redemption Management
// ============================================================================

export const getCustomerRedemptions = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const redemptions = await loyaltyRepo.findCustomerRedemptions(customerId, limit);
  respond(res, redemptions);
  
};

export const updateRedemptionStatus = async (req: TypedRequest<Record<string, string>, unknown, UpdateRedemptionStatusBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'used', 'expired', 'cancelled'].includes(status)) {
    respondError(res, 'Valid status (pending, used, expired, or cancelled) is required', 400);
    return;
  }

  const redemption = await loyaltyRepo.updateRedemptionStatus(id, status as 'pending' | 'used' | 'expired' | 'cancelled');

  respondWithMessage(res, redemption, `Redemption status updated to ${status}`);
  
};

// ============================================================================
// Order Processing
// ============================================================================

export const processOrderPoints = async (req: TypedRequest<Record<string, string>, unknown, ProcessOrderPointsBody>, res: Response): Promise<void> => {
  const { orderId } = req.params;
  const { orderAmount, customerId } = req.body;

  if (!orderAmount || !customerId) {
    respondError(res, 'Order amount and customer ID are required', 400);
    return;
  }

  const updatedPoints = await loyaltyRepo.processOrderPoints(customerId, orderId, parseFloat(orderAmount));

  respondWithMessage(res, updatedPoints, 'Order points processed successfully');
  
};
