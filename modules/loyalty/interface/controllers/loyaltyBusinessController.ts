import { jsonResponse } from 'libs/apiResponse';
/**
 * Loyalty Business Controller
 *
 * Handles business/admin endpoints for loyalty management.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageLoyaltyAdminUseCase, adjustCustomerPointsUseCase } from '../../application/wired';

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
  jsonResponse(res, statusCode, { success: true, data });
}

function respondWithMessage(res: HttpResponse, data: unknown, message: string, statusCode: number = 200): void {
  jsonResponse(res, statusCode, { success: true, data, message });
}

function respondError(res: HttpResponse, message: string, statusCode: number = 500): void {
  jsonResponse(res, statusCode, { success: false, message });
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

  respond(res, await manageLoyaltyAdminUseCase.getTierById(id));
};

export const createTier = async (req: HttpRequest<Record<string, string>, unknown, CreateTierBody>, res: HttpResponse): Promise<void> => {
  const { name, description, type, pointsThreshold, multiplier, benefits, isActive } = req.body;

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

  respond(res, await manageLoyaltyAdminUseCase.getRewardById(id));
};

export const createReward = async (
  req: HttpRequest<Record<string, string>, unknown, CreateRewardBody>,
  res: HttpResponse,
): Promise<void> => {
  const {
    name,
    description,
    pointsCost,
    discountAmountCents,
    discountPercent,
    discountCode,
    freeShipping,
    productIds,
    expiresAt,
    isActive,
  } = req.body;

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
};

export const updateReward = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateRewardBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const {
    name,
    description,
    pointsCost,
    discountAmountCents,
    discountPercent,
    discountCode,
    freeShipping,
    productIds,
    expiresAt,
    isActive,
  } = req.body;

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

  jsonResponse(res, 200, {
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

  const updatedPoints = await adjustCustomerPointsUseCase.execute({ customerId, points, reason, tierId });
  respondWithMessage(res, updatedPoints, `Customer points ${parseInt(points) >= 0 ? 'increased' : 'decreased'} successfully`);
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

  const redemption = await manageLoyaltyAdminUseCase.updateRedemptionStatus(id, status);
  respondWithMessage(res, redemption, `Redemption status updated to ${status}`);
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

  const updatedPoints = await manageLoyaltyAdminUseCase.processOrderPoints(orderId, orderAmount, customerId);
  respondWithMessage(res, updatedPoints, 'Order points processed successfully');
};
