/**
 * Loyalty Business Controller
 *
 * Handles business/admin endpoints for loyalty management.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageLoyaltyAdminUseCase, adjustCustomerPointsUseCase } from '../../application/wired';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';

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
  discountAmountCents?: number;
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
  discountAmountCents?: number;
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

function respond(res: HttpResponse, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondWithMessage(res: HttpResponse, data: unknown, message: string, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data, message });
}

function respondError(res: HttpResponse, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, message });
}

function respondUseCaseError(res: HttpResponse, error: unknown, fallback: string): void {
  respondError(res, getErrorMessage(error) || fallback, getErrorStatusCode(error));
}

// ============================================================================
// Tier Management
// ============================================================================

export const getTiers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const includeInactive = req.query.includeInactive === 'true';
  const tiers = await manageLoyaltyAdminUseCase.findAllTiers(includeInactive);
  respond(res, tiers);
};

export const getTierById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    respond(res, await manageLoyaltyAdminUseCase.getTierById(id));
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to load loyalty tier');
  }
};

export const createTier = async (req: HttpRequest<Record<string, string>, unknown, CreateTierBody>, res: HttpResponse): Promise<void> => {
  const { name, description, type, pointsThreshold, multiplier, benefits, isActive } = req.body;

  try {
    const tier = await manageLoyaltyAdminUseCase.createTier({
      name,
      description,
      type,
      pointsThreshold,
      multiplier,
      benefits,
      isActive,
    });
    respondWithMessage(res, tier, 'Loyalty tier created successfully', 201);
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to create loyalty tier');
  }
};

export const updateTier = async (req: HttpRequest<Record<string, string>, unknown, UpdateTierBody>, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const { name, description, type, pointsThreshold, multiplier, benefits, isActive } = req.body;

  const tier = await manageLoyaltyAdminUseCase.updateTier(id, {
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

export const getRewards = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const includeInactive = req.query.includeInactive === 'true';
  const rewards = await manageLoyaltyAdminUseCase.findAllRewards(includeInactive);
  respond(res, rewards);
};

export const getRewardById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    respond(res, await manageLoyaltyAdminUseCase.getRewardById(id));
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to load loyalty reward');
  }
};

export const createReward = async (
  req: HttpRequest<Record<string, string>, unknown, CreateRewardBody>,
  res: HttpResponse,
): Promise<void> => {
  const { name, description, pointsCost, discountAmountCents, discountPercent, discountCode, freeShipping, productIds, expiresAt, isActive } =
    req.body;

  try {
    const reward = await manageLoyaltyAdminUseCase.createReward({
      name,
      description,
      pointsCost,
      discountAmountCents,
      discountPercent,
      discountCode,
      freeShipping,
      productIds,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive,
    });
    respondWithMessage(res, reward, 'Loyalty reward created successfully', 201);
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to create loyalty reward');
  }
};

export const updateReward = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateRewardBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { name, description, pointsCost, discountAmountCents, discountPercent, discountCode, freeShipping, productIds, expiresAt, isActive } =
    req.body;

  const reward = await manageLoyaltyAdminUseCase.updateReward(id, {
    name,
    description,
    pointsCost,
    discountAmountCents,
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

export const getCustomerPoints = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { customerId } = req.params;
  const pointsData = await manageLoyaltyAdminUseCase.findCustomerPointsWithTier(customerId);

  if (!pointsData) {
    respondError(res, `No loyalty points found for customer ${customerId}`, 404);
    return;
  }

  respond(res, {
    ...pointsData.points,
    tier: pointsData.tier,
  });
};

export const getCustomerPointsTransactions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { customerId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const transactions = await manageLoyaltyAdminUseCase.findCustomerTransactions(customerId, limit);

  res.json({
    success: true,
    data: transactions,
    pagination: { limit },
  });
};

export const adjustCustomerPoints = async (
  req: HttpRequest<Record<string, string>, unknown, AdjustPointsBody>,
  res: HttpResponse,
): Promise<void> => {
  const { customerId } = req.params;
  const { points, reason, tierId } = req.body;

  try {
    const updatedPoints = await adjustCustomerPointsUseCase.execute({ customerId, points, reason, tierId });
    respondWithMessage(res, updatedPoints, `Customer points ${parseInt(points) >= 0 ? 'increased' : 'decreased'} successfully`);
  } catch (error) {
    respondError(res, error instanceof Error ? error.message : 'Failed to adjust points', getErrorStatusCode(error));
  }
};

// ============================================================================
// Redemption Management
// ============================================================================

export const getCustomerRedemptions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { customerId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const redemptions = await manageLoyaltyAdminUseCase.findCustomerRedemptions(customerId, limit);
  respond(res, redemptions);
};

export const updateRedemptionStatus = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateRedemptionStatusBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const redemption = await manageLoyaltyAdminUseCase.updateRedemptionStatus(id, status);
    respondWithMessage(res, redemption, `Redemption status updated to ${status}`);
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to update redemption status');
  }
};

// ============================================================================
// Order Processing
// ============================================================================

export const processOrderPoints = async (
  req: HttpRequest<Record<string, string>, unknown, ProcessOrderPointsBody>,
  res: HttpResponse,
): Promise<void> => {
  const { orderId } = req.params;
  const { orderAmount, customerId } = req.body;

  try {
    const updatedPoints = await manageLoyaltyAdminUseCase.processOrderPoints(orderId, orderAmount, customerId);
    respondWithMessage(res, updatedPoints, 'Order points processed successfully');
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to process order points');
  }
};
