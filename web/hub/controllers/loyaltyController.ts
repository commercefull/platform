/**
 * Loyalty Controller
 * Handles loyalty programs, points, rewards, and redemptions for the Admin Hub
 */

import { Request, Response } from 'express';
import loyaltyRepo from '../../../modules/loyalty/repos/loyaltyRepo';

// ============================================================================
// Loyalty Tiers Management
// ============================================================================

export const listLoyaltyTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';

    const tiers = await loyaltyRepo.findAllTiers(includeInactive);

    res.render('hub/views/programs/loyalty/tiers/index', {
      pageName: 'Loyalty Tiers',
      tiers,
      filters: { includeInactive },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing loyalty tiers:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load loyalty tiers',
      user: req.user
    });
  }
};

export const createLoyaltyTierForm = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('hub/views/programs/loyalty/tiers/create', {
      pageName: 'Create Loyalty Tier',
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create tier form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createLoyaltyTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      type,
      pointsThreshold,
      multiplier,
      benefits
    } = req.body;

    const tier = await loyaltyRepo.createTier({
      name,
      description: description || undefined,
      type: type || 'custom',
      pointsThreshold: parseInt(pointsThreshold),
      multiplier: parseFloat(multiplier),
      benefits: benefits ? JSON.parse(benefits) : undefined
    });

    res.redirect(`/hub/loyalty/tiers/${tier.loyaltyTierId}?success=Loyalty tier created successfully`);
  } catch (error: any) {
    console.error('Error creating loyalty tier:', error);

    res.render('hub/views/programs/loyalty/tiers/create', {
      pageName: 'Create Loyalty Tier',
      error: error.message || 'Failed to create loyalty tier',
      formData: req.body,
      user: req.user
    });
  }
};

export const viewLoyaltyTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tierId } = req.params;

    const tier = await loyaltyRepo.findTierById(tierId);

    if (!tier) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Loyalty tier not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/programs/loyalty/tiers/view', {
      pageName: `Tier: ${tier.name}`,
      tier,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing loyalty tier:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load loyalty tier',
      user: req.user
    });
  }
};

export const editLoyaltyTierForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tierId } = req.params;

    const tier = await loyaltyRepo.findTierById(tierId);

    if (!tier) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Loyalty tier not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/programs/loyalty/tiers/edit', {
      pageName: `Edit: ${tier.name}`,
      tier,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading edit tier form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const updateLoyaltyTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tierId } = req.params;
    const updates: any = {};

    const {
      name,
      description,
      type,
      pointsThreshold,
      multiplier,
      benefits,
      isActive
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description || undefined;
    if (type !== undefined) updates.type = type;
    if (pointsThreshold !== undefined) updates.pointsThreshold = parseInt(pointsThreshold);
    if (multiplier !== undefined) updates.multiplier = parseFloat(multiplier);
    if (benefits !== undefined) updates.benefits = benefits ? JSON.parse(benefits) : undefined;
    if (isActive !== undefined) updates.isActive = isActive === 'true';

    const tier = await loyaltyRepo.updateTier(tierId, updates);

    res.redirect(`/hub/loyalty/tiers/${tierId}?success=Loyalty tier updated successfully`);
  } catch (error: any) {
    console.error('Error updating loyalty tier:', error);

    try {
      const tier = await loyaltyRepo.findTierById(req.params.tierId);

      res.render('hub/views/programs/loyalty/tiers/edit', {
        pageName: `Edit: ${tier?.name || 'Tier'}`,
        tier,
        error: error.message || 'Failed to update loyalty tier',
        formData: req.body,
        user: req.user
      });
    } catch {
      res.status(500).render('hub/views/error', {
        pageName: 'Error',
        error: error.message || 'Failed to update loyalty tier',
        user: req.user
      });
    }
  }
};

export const deleteLoyaltyTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tierId } = req.params;

    await loyaltyRepo.deleteTier(tierId);

    res.json({ success: true, message: 'Loyalty tier deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting loyalty tier:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete loyalty tier' });
  }
};

// ============================================================================
// Loyalty Rewards Management
// ============================================================================

export const listLoyaltyRewards = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';

    const rewards = await loyaltyRepo.findAllRewards(includeInactive);

    res.render('hub/views/programs/loyalty/rewards/index', {
      pageName: 'Loyalty Rewards',
      rewards,
      filters: { includeInactive },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing loyalty rewards:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load loyalty rewards',
      user: req.user
    });
  }
};

export const createLoyaltyRewardForm = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('hub/views/programs/loyalty/rewards/create', {
      pageName: 'Create Loyalty Reward',
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create reward form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createLoyaltyReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      pointsCost,
      discountAmount,
      discountPercent,
      discountCode,
      freeShipping,
      productIds,
      expiresAt
    } = req.body;

    const reward = await loyaltyRepo.createReward({
      name,
      description: description || undefined,
      pointsCost: parseInt(pointsCost),
      discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
      discountPercent: discountPercent ? parseFloat(discountPercent) : undefined,
      discountCode: discountCode || undefined,
      freeShipping: freeShipping === 'true',
      productIds: productIds ? JSON.parse(productIds) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.redirect(`/hub/loyalty/rewards/${reward.loyaltyRewardId}?success=Loyalty reward created successfully`);
  } catch (error: any) {
    console.error('Error creating loyalty reward:', error);

    res.render('hub/views/programs/loyalty/rewards/create', {
      pageName: 'Create Loyalty Reward',
      error: error.message || 'Failed to create loyalty reward',
      formData: req.body,
      user: req.user
    });
  }
};

export const viewLoyaltyReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rewardId } = req.params;

    const reward = await loyaltyRepo.findRewardById(rewardId);

    if (!reward) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Loyalty reward not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/programs/loyalty/rewards/view', {
      pageName: `Reward: ${reward.name}`,
      reward,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing loyalty reward:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load loyalty reward',
      user: req.user
    });
  }
};

export const editLoyaltyRewardForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rewardId } = req.params;

    const reward = await loyaltyRepo.findRewardById(rewardId);

    if (!reward) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Loyalty reward not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/programs/loyalty/rewards/edit', {
      pageName: `Edit: ${reward.name}`,
      reward,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading edit reward form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const updateLoyaltyReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rewardId } = req.params;
    const updates: any = {};

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

    const reward = await loyaltyRepo.updateReward(rewardId, updates);

    res.redirect(`/hub/loyalty/rewards/${rewardId}?success=Loyalty reward updated successfully`);
  } catch (error: any) {
    console.error('Error updating loyalty reward:', error);

    try {
      const reward = await loyaltyRepo.findRewardById(req.params.rewardId);

      res.render('hub/views/programs/loyalty/rewards/edit', {
        pageName: `Edit: ${reward?.name || 'Reward'}`,
        reward,
        error: error.message || 'Failed to update loyalty reward',
        formData: req.body,
        user: req.user
      });
    } catch {
      res.status(500).render('hub/views/error', {
        pageName: 'Error',
        error: error.message || 'Failed to update loyalty reward',
        user: req.user
      });
    }
  }
};

export const deleteLoyaltyReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rewardId } = req.params;

    await loyaltyRepo.deleteReward(rewardId);

    res.json({ success: true, message: 'Loyalty reward deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting loyalty reward:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete loyalty reward' });
  }
};

// ============================================================================
// Customer Loyalty Management
// ============================================================================

export const listCustomerLoyalty = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.query.customerId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get all customer points (would need to implement search/filter)
    // For now, this is a placeholder

    res.render('hub/views/programs/loyalty/customers/index', {
      pageName: 'Customer Loyalty',
      customers: [], // Would need implementation
      filters: { customerId },
      pagination: { limit, offset },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing customer loyalty:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load customer loyalty',
      user: req.user
    });
  }
};

export const viewCustomerLoyalty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const pointsData = await loyaltyRepo.findCustomerPointsWithTier(customerId);
    const transactions = await loyaltyRepo.findCustomerTransactions(customerId, 20);
    const redemptions = await loyaltyRepo.findCustomerRedemptions(customerId, 20);

    if (!pointsData) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Customer loyalty account not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/programs/loyalty/customers/view', {
      pageName: `Loyalty: ${customerId}`,
      pointsData,
      transactions,
      redemptions,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing customer loyalty:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load customer loyalty',
      user: req.user
    });
  }
};

// ============================================================================
// Loyalty Analytics
// ============================================================================

export const loyaltyAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get basic analytics (would need to implement proper analytics queries)
    const stats = {
      totalMembers: 0,
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      totalRedemptions: 0,
      avgPointsPerMember: 0,
      topRewards: [],
      recentTransactions: []
    };

    res.render('hub/views/programs/loyalty/analytics/index', {
      pageName: 'Loyalty Analytics',
      stats,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading loyalty analytics:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load loyalty analytics',
      user: req.user
    });
  }
};
