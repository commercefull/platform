/**
 * Loyalty Controller
 * Handles loyalty programs, points, rewards, and redemptions for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageLoyaltyAdminUseCase } from '../../../modules/loyalty/application/useCases/ManageLoyalty';
import { adminRespond } from '../../respond';

const manageLoyaltyAdminUseCase = new ManageLoyaltyAdminUseCase();

// ============================================================================
// Loyalty Tiers Management
// ============================================================================

export const listLoyaltyTiers = async (req: TypedRequest, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === 'true';

  const tiers = await manageLoyaltyAdminUseCase.findAllTiers(includeInactive);

  adminRespond(req, res, 'programs/loyalty/tiers/index', {
    pageName: 'Loyalty Tiers',
    tiers,
    filters: { includeInactive },
    success: req.query.success || null,
  });
  
};

export const createLoyaltyTierForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'programs/loyalty/tiers/create', {
    pageName: 'Create Loyalty Tier',
  });
  
};

export const createLoyaltyTier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description, type, pointsThreshold, multiplier, benefits } = body;

    const tier = await manageLoyaltyAdminUseCase.createTier({
      name,
      description: description || undefined,
      type: type || 'custom',
      pointsThreshold: parseInt(pointsThreshold),
      multiplier: parseFloat(multiplier),
      benefits: benefits ? JSON.parse(benefits) : undefined,
    });

    res.redirect(`/hub/loyalty/tiers/${tier.tierId}?success=Loyalty tier created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'programs/loyalty/tiers/create', {
      pageName: 'Create Loyalty Tier',
      error: (error as Error).message || 'Failed to create loyalty tier',
      formData: req.body as RequestBody,
    });
  }
};

export const viewLoyaltyTier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { tierId } = req.params;

  const tier = await manageLoyaltyAdminUseCase.findTierById(tierId);

  if (!tier) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Loyalty tier not found',
    });
    return;
  }

  adminRespond(req, res, 'programs/loyalty/tiers/view', {
    pageName: `Tier: ${tier.name}`,
    tier,
    success: req.query.success || null,
  });
  
};

export const editLoyaltyTierForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { tierId } = req.params;

  const tier = await manageLoyaltyAdminUseCase.findTierById(tierId);

  if (!tier) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Loyalty tier not found',
    });
    return;
  }

  adminRespond(req, res, 'programs/loyalty/tiers/edit', {
    pageName: `Edit: ${tier.name}`,
    tier,
  });
  
};

export const updateLoyaltyTier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { tierId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const { name, description, type, pointsThreshold, multiplier, benefits, isActive } = body;

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || undefined;
  if (type !== undefined) updates.type = type;
  if (pointsThreshold !== undefined) updates.pointsThreshold = parseInt(pointsThreshold);
  if (multiplier !== undefined) updates.multiplier = parseFloat(multiplier);
  if (benefits !== undefined) updates.benefits = benefits ? JSON.parse(benefits) : undefined;
  if (isActive !== undefined) updates.isActive = isActive === 'true';

  const _tier = await manageLoyaltyAdminUseCase.updateTier(tierId, updates);

  res.redirect(`/hub/loyalty/tiers/${tierId}?success=Loyalty tier updated successfully`);
  
};

export const deleteLoyaltyTier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { tierId } = req.params;

  await manageLoyaltyAdminUseCase.deleteTier(tierId);

  res.json({ success: true, message: 'Loyalty tier deleted successfully' });
  
};

// ============================================================================
// Loyalty Rewards Management
// ============================================================================

export const listLoyaltyRewards = async (req: TypedRequest, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === 'true';

  const rewards = await manageLoyaltyAdminUseCase.findAllRewards(includeInactive);

  adminRespond(req, res, 'programs/loyalty/rewards/index', {
    pageName: 'Loyalty Rewards',
    rewards,
    filters: { includeInactive },

    success: req.query.success || null,
  });
  
};

export const createLoyaltyRewardForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'programs/loyalty/rewards/create', {
    pageName: 'Create Loyalty Reward',
  });
  
};

export const createLoyaltyReward = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description, pointsCost, discountAmount, discountPercent, discountCode, freeShipping, productIds, expiresAt } = body;

    const reward = await manageLoyaltyAdminUseCase.createReward({
      name,
      description: description || undefined,
      pointsCost: parseInt(pointsCost),
      discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
      discountPercent: discountPercent ? parseFloat(discountPercent) : undefined,
      discountCode: discountCode || undefined,
      freeShipping: freeShipping === 'true',
      productIds: productIds ? JSON.parse(productIds) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.redirect(`/hub/loyalty/rewards/${reward.rewardId}?success=Loyalty reward created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'programs/loyalty/rewards/create', {
      pageName: 'Create Loyalty Reward',
      error: (error as Error).message || 'Failed to create loyalty reward',
      formData: req.body as RequestBody,
    });
  }
};

export const viewLoyaltyReward = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rewardId } = req.params;

  const reward = await manageLoyaltyAdminUseCase.findRewardById(rewardId);

  if (!reward) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Loyalty reward not found',
    });
    return;
  }

  adminRespond(req, res, 'programs/loyalty/rewards/view', {
    pageName: `Reward: ${reward.name}`,
    reward,

    success: req.query.success || null,
  });
  
};

export const editLoyaltyRewardForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rewardId } = req.params;

  const reward = await manageLoyaltyAdminUseCase.findRewardById(rewardId);

  if (!reward) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Loyalty reward not found',
    });
    return;
  }

  adminRespond(req, res, 'programs/loyalty/rewards/edit', {
    pageName: `Edit: ${reward.name}`,
    reward,
  });
  
};

export const updateLoyaltyReward = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rewardId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const { name, description, pointsCost, discountAmount, discountPercent, discountCode, freeShipping, productIds, expiresAt, isActive } = body;

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || undefined;
  if (pointsCost !== undefined) updates.pointsCost = parseInt(pointsCost);
  if (discountAmount !== undefined) updates.discountAmount = discountAmount ? parseFloat(discountAmount) : undefined;
  if (discountPercent !== undefined) updates.discountPercent = discountPercent ? parseFloat(discountPercent) : undefined;
  if (discountCode !== undefined) updates.discountCode = discountCode || undefined;
  if (freeShipping !== undefined) updates.freeShipping = freeShipping === 'true';
  if (productIds !== undefined) updates.productIds = productIds ? JSON.parse(productIds) : undefined;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
  if (isActive !== undefined) updates.isActive = isActive !== 'false';

  const _reward = await manageLoyaltyAdminUseCase.updateReward(rewardId, updates);

  res.redirect(`/hub/loyalty/rewards/${rewardId}?success=Loyalty reward updated successfully`);
  
};

export const deleteLoyaltyReward = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rewardId } = req.params;

  await manageLoyaltyAdminUseCase.deleteReward(rewardId);

  res.json({ success: true, message: 'Loyalty reward deleted successfully' });
  
};

// ============================================================================
// Customer Loyalty Management
// ============================================================================

export const listCustomerLoyalty = async (req: TypedRequest, res: Response): Promise<void> => {
  const customerId = req.query.customerId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // Get all customer points (would need to implement search/filter)
  // For now, this is a placeholder

  adminRespond(req, res, 'programs/loyalty/customers/index', {
    pageName: 'Customer Loyalty',
    customers: [], // Would need implementation
    filters: { customerId },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

export const viewCustomerLoyalty = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;

  const pointsData = await manageLoyaltyAdminUseCase.findCustomerPointsWithTier(customerId);
  const transactions = await manageLoyaltyAdminUseCase.findCustomerTransactions(customerId, 20);
  const redemptions = await manageLoyaltyAdminUseCase.findCustomerRedemptions(customerId, 20);

  if (!pointsData) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Customer loyalty account not found',
    });
    return;
  }

  adminRespond(req, res, 'programs/loyalty/customers/view', {
    pageName: `Loyalty: ${customerId}`,
    pointsData,
    transactions,
    redemptions,

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Loyalty Analytics
// ============================================================================

export const loyaltyAnalytics = async (req: TypedRequest, res: Response): Promise<void> => {
  // Get basic analytics (would need to implement proper analytics queries)
  const stats = {
    totalMembers: 0,
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    totalRedemptions: 0,
    avgPointsPerMember: 0,
    topRewards: [],
    recentTransactions: [],
  };

  adminRespond(req, res, 'programs/loyalty/analytics/index', {
    pageName: 'Loyalty Analytics',
    stats,
  });
  
};
