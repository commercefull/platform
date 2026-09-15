/**
 * Promotion Controller
 * Handles promotion management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ListPromotionsCommand } from '../../application/useCases/ListPromotions';
import { CreatePromotionCommand } from '../../application/useCases/CreatePromotion';
import { UpdatePromotionCommand } from '../../application/useCases/UpdatePromotion';
import { DeletePromotionCommand } from '../../application/useCases/DeletePromotion';
import {
  listPromotionsUseCase,
  createPromotionUseCase,
  updatePromotionUseCase,
  deletePromotionUseCase,
} from '../../application/useCases/wired';
import { ManagePromotionsUseCase } from '../../application/useCases/ManagePromotions';
import { promotionEvaluationService, type PromotionEvaluationContext } from '../../application/services/PromotionEvaluationService';
import { adminRespond } from '../../../../libs/adminRespond';

const managePromotionsUseCase = new ManagePromotionsUseCase();

// ============================================================================
// List Promotions
// ============================================================================

export const listPromotions = async (req: TypedRequest, res: Response): Promise<void> => {
  const { status, type, search, limit, offset, orderBy, orderDirection } = req.query;

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (type) filters.type = type;
  if (search) filters.search = search as string;

  const command = new ListPromotionsCommand(filters, {
    limit: parseInt(limit as string) || 50,
    offset: parseInt(offset as string) || 0,
    orderBy: (orderBy as string) || 'createdAt',
    direction: (orderDirection as 'ASC' | 'DESC') || 'DESC',
  });

  const result = await listPromotionsUseCase.execute(command);

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
};

// ============================================================================
// Create Promotion Form
// ============================================================================

export const createPromotionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'promotions/create', {
    pageName: 'Create Promotion',
  });
};

// ============================================================================
// Create Promotion
// ============================================================================

export const createPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { code, name, description, type, value, minOrderAmount, maxDiscountAmount, usageLimit, usageLimitPerCustomer, startsAt, endsAt } =
      body;

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

    const result = await createPromotionUseCase.execute(command);

    res.redirect(`/hub/promotions/${result.promotionId}?success=Promotion created successfully`);
  } catch (error: unknown) {
    logger.warning('Error:', error);

    // Reload form with error
    adminRespond(req, res, 'promotions/create', {
      pageName: 'Create Promotion',
      error: (error as Error).message || 'Failed to create promotion',
      formData: req.body as RequestBody,
    });
  }
};

// ============================================================================
// View Promotion
// ============================================================================

export const viewPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  const { promotionId } = req.params;

  // For now, we'll use the repository directly since we don't have a GetPromotion use case
  const promotion = await managePromotionsUseCase.findById(promotionId);

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
};

// ============================================================================
// Edit Promotion Form
// ============================================================================

export const editPromotionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { promotionId } = req.params;

  const promotion = await managePromotionsUseCase.findById(promotionId);

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
};

// ============================================================================
// Update Promotion
// ============================================================================

export const updatePromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  const { promotionId } = req.params;
  const updates: Record<string, unknown> = {};

  // Map form fields to update object
  const body = req.body as RequestBody;
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
  } = body;

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
  await updatePromotionUseCase.execute(command);

  res.redirect(`/hub/promotions/${promotionId}?success=Promotion updated successfully`);
};

// ============================================================================
// Delete Promotion (AJAX)
// ============================================================================

export const deletePromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  const { promotionId } = req.params;

  const command = new DeletePromotionCommand(promotionId);
  await deletePromotionUseCase.execute(command);

  res.json({ success: true, message: 'Promotion deleted successfully' });
};

// ============================================================================
// Promotion Preview (server-side evaluation via PromotionEvaluationService)
// ============================================================================

export const previewPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      items: rawItems,
      subtotal,
      shippingAmount,
      customerId,
      customerGroup,
      isFirstOrder,
      shippingMethodId,
      paymentMethodId,
      couponCode,
      currency,
    } = body;

    // Build sample cart items from request
    const items = Array.isArray(rawItems)
      ? rawItems
      : [
          {
            productId: 'sample-product',
            name: 'Sample Product',
            quantity: parseInt(body.itemQty as string, 10) || 1,
            unitPrice: parseFloat(body.cartTotal as string) || parseFloat(subtotal as string) || 100,
          },
        ];

    const context: PromotionEvaluationContext = {
      items: items.map(
        (item: { productId: string; name: string; quantity: number; unitPrice: number; categoryId?: string; isDigital?: boolean }) => ({
          productId: item.productId || 'sample-product',
          name: item.name || 'Sample Product',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          categoryId: item.categoryId,
          isDigital: item.isDigital,
        }),
      ),
      subtotal:
        parseFloat(subtotal as string) ||
        items.reduce((sum: number, i: { unitPrice: number; quantity: number }) => sum + i.unitPrice * i.quantity, 0),
      shippingAmount: parseFloat(shippingAmount as string) || 0,
      customerId: customerId || undefined,
      customerGroup: customerGroup || undefined,
      isFirstOrder: isFirstOrder === 'true',
      shippingMethodId: shippingMethodId || undefined,
      paymentMethodId: paymentMethodId || undefined,
      couponCode: couponCode || undefined,
      currency: currency || 'USD',
    };

    const result = await promotionEvaluationService.evaluate(context);

    res.json({
      success: true,
      totalDiscountAmount: result.totalDiscountAmount,
      shippingDiscountAmount: result.shippingDiscountAmount,
      freeShipping: result.freeShipping,
      lineItemDiscounts: result.lineItemDiscounts,
      freeItems: result.freeItems,
      appliedPromotions: result.appliedPromotions,
      message: result.message,
      finalTotal: context.subtotal - result.totalDiscountAmount,
    });
  } catch (error: unknown) {
    logger.warning('Error previewing promotion:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
