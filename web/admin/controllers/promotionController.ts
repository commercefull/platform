/**
 * Promotion Controller
 * Handles promotion management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import PromotionRepo from '../../../modules/promotion/repos/promotionRepo';
import { ListPromotionsUseCase, ListPromotionsCommand } from '../../../modules/promotion/application/useCases/ListPromotions';
import { CreatePromotionUseCase, CreatePromotionCommand } from '../../../modules/promotion/application/useCases/CreatePromotion';
import { UpdatePromotionUseCase, UpdatePromotionCommand } from '../../../modules/promotion/application/useCases/UpdatePromotion';
import { DeletePromotionUseCase, DeletePromotionCommand } from '../../../modules/promotion/application/useCases/DeletePromotion';
import { adminRespond } from '../../respond';

// ============================================================================
// List Promotions
// ============================================================================

export const listPromotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, search, limit, offset, orderBy, orderDirection } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (search) filters.search = search as string;

    const command = new ListPromotionsCommand(filters, {
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
      orderBy: (orderBy as string) || 'createdAt',
      direction: (orderDirection as 'ASC' | 'DESC') || 'DESC',
    });

    const useCase = new ListPromotionsUseCase(PromotionRepo);
    const result = await useCase.execute(command);

    // Calculate pagination info
    const page = Math.floor((result.offset || 0) / (result.limit || 50)) + 1;
    const pages = Math.ceil(result.total / (result.limit || 50));

    adminRespond(req, res, 'promotions/index', {
      pageName: 'Promotions',
      promotions: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page,
        pages,
        hasMore: result.hasMore,
      },
      filters: {
        status: status || '',
        type: type || '',
        search: search || '',
      },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load promotions',
    });
  }
};

// ============================================================================
// Create Promotion Form
// ============================================================================

export const createPromotionForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'promotions/create', {
      pageName: 'Create Promotion',
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

// ============================================================================
// Create Promotion
// ============================================================================

export const createPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, description, type, value, minOrderAmount, maxDiscountAmount, usageLimit, usageLimitPerCustomer, startsAt, endsAt } =
      req.body;

    const command = new CreatePromotionCommand(
      name,
      type,
      parseFloat(value),
      code,
      description,
      minOrderAmount ? parseFloat(minOrderAmount) : undefined,
      maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
      usageLimit ? parseInt(usageLimit) : undefined,
      usageLimitPerCustomer ? parseInt(usageLimitPerCustomer) : undefined,
      startsAt ? new Date(startsAt) : undefined,
      endsAt ? new Date(endsAt) : undefined,
    );

    const useCase = new CreatePromotionUseCase(PromotionRepo);
    const result = await useCase.execute(command);

    res.redirect(`/hub/promotions/${result.promotionId}?success=Promotion created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    // Reload form with error
    adminRespond(req, res, 'promotions/create', {
      pageName: 'Create Promotion',
      error: error.message || 'Failed to create promotion',
      formData: req.body,
    });
  }
};

// ============================================================================
// View Promotion
// ============================================================================

export const viewPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promotionId } = req.params;

    // For now, we'll use the repository directly since we don't have a GetPromotion use case
    const promotion = await PromotionRepo.findById(promotionId);

    if (!promotion) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Promotion not found',
      });
      return;
    }

    adminRespond(req, res, 'promotions/view', {
      pageName: `Promotion: ${promotion.name}`,
      promotion,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load promotion',
    });
  }
};

// ============================================================================
// Edit Promotion Form
// ============================================================================

export const editPromotionForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promotionId } = req.params;

    const promotion = await PromotionRepo.findById(promotionId);

    if (!promotion) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Promotion not found',
      });
      return;
    }

    adminRespond(req, res, 'promotions/edit', {
      pageName: `Edit: ${promotion.name}`,
      promotion,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

// ============================================================================
// Update Promotion
// ============================================================================

export const updatePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promotionId } = req.params;
    const updates: any = {};

    // Map form fields to update object
    const {
      name,
      description,
      status,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerCustomer,
      startsAt,
      endsAt,
      isActive,
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (value !== undefined) updates.value = parseFloat(value);
    if (minOrderAmount !== undefined) updates.minOrderAmount = minOrderAmount ? parseFloat(minOrderAmount) : undefined;
    if (maxDiscountAmount !== undefined) updates.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined;
    if (usageLimit !== undefined) updates.usageLimit = usageLimit ? parseInt(usageLimit) : undefined;
    if (usageLimitPerCustomer !== undefined)
      updates.usageLimitPerCustomer = usageLimitPerCustomer ? parseInt(usageLimitPerCustomer) : undefined;
    if (startsAt !== undefined) updates.startsAt = startsAt ? new Date(startsAt) : undefined;
    if (endsAt !== undefined) updates.endsAt = endsAt ? new Date(endsAt) : undefined;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;

    const command = new UpdatePromotionCommand(promotionId, updates);
    const useCase = new UpdatePromotionUseCase(PromotionRepo);
    await useCase.execute(command);

    res.redirect(`/hub/promotions/${promotionId}?success=Promotion updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    // Reload form with error
    try {
      const promotion = await PromotionRepo.findById(req.params.promotionId);

      adminRespond(req, res, 'promotions/edit', {
        pageName: `Edit: ${promotion?.name || 'Promotion'}`,
        promotion,
        error: error.message || 'Failed to update promotion',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update promotion',
      });
    }
  }
};

// ============================================================================
// Delete Promotion (AJAX)
// ============================================================================

export const deletePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promotionId } = req.params;

    const command = new DeletePromotionCommand(promotionId);
    const useCase = new DeletePromotionUseCase(PromotionRepo);
    await useCase.execute(command);

    res.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete promotion' });
  }
};
