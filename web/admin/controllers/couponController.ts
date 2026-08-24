/**
 * Coupon Controller
 * Handles coupon management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageCouponsUseCase } from '../../../modules/promotion/application/useCases/ManagePromotions';
import { adminRespond } from '../../respond';

const manageCouponsUseCase = new ManageCouponsUseCase();

// ============================================================================
// Coupon Management
// ============================================================================

export const listCoupons = async (req: TypedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const coupons = await manageCouponsUseCase.findAll('default-organization', {
    isActive,
    limit,
    offset,
  });

  // Get active coupons count for stats
  const activeCoupons = await manageCouponsUseCase.findActiveCoupons('default-organization');

  adminRespond(req, res, 'promotions/coupons/index', {
    pageName: 'Coupon Management',
    coupons,
    activeCoupons: activeCoupons.length,
    filters: { status, isActive },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

export const createCouponForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'promotions/coupons/create', {
    pageName: 'Create Coupon',
  });
  
};

export const createCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      code,
      name,
      description,
      type,
      discountAmount,
      currencyCode,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      isActive,
      isOneTimeUse,
      maxUsage,
      maxUsagePerCustomer,
    } = body;

    const coupon = await manageCouponsUseCase.create({
      code,
      name,
      description: description || undefined,
      type,
      discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
      currencyCode: currencyCode || 'USD',
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: isActive === 'true',
      isOneTimeUse: isOneTimeUse === 'true',
      maxUsage: maxUsage ? parseInt(maxUsage) : undefined,
      maxUsagePerCustomer: maxUsagePerCustomer ? parseInt(maxUsagePerCustomer) : 1,
      organizationId: 'default-organization',
    });

    res.redirect(`/hub/promotions/coupons/${coupon.promotionCouponId}?success=Coupon created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'promotions/coupons/create', {
      pageName: 'Create Coupon',
      error: (error as Error).message || 'Failed to create coupon',
      formData: req.body as RequestBody,
    });
  }
};

export const viewCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  const { couponId } = req.params;

  const coupon = await manageCouponsUseCase.findById(couponId);

  if (!coupon) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Coupon not found',
    });
    return;
  }

  // Get usage records
  const usage = await manageCouponsUseCase.getUsage(couponId);

  adminRespond(req, res, 'promotions/coupons/view', {
    pageName: `Coupon: ${coupon.name}`,
    coupon,
    usage,

    success: req.query.success || null,
  });
  
};

export const editCouponForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { couponId } = req.params;

  const coupon = await manageCouponsUseCase.findById(couponId);

  if (!coupon) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Coupon not found',
    });
    return;
  }

  adminRespond(req, res, 'promotions/coupons/edit', {
    pageName: `Edit: ${coupon.name}`,
    coupon,
  });
  
};

export const updateCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  const { couponId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const {
    name,
    description,
    type,
    discountAmount,
    currencyCode,
    minOrderAmount,
    maxDiscountAmount,
    startDate,
    endDate,
    isActive,
    isOneTimeUse,
    maxUsage,
    maxUsagePerCustomer,
  } = body;

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || undefined;
  if (type !== undefined) updates.type = type;
  if (discountAmount !== undefined) updates.discountAmount = discountAmount ? parseFloat(discountAmount) : undefined;
  if (currencyCode !== undefined) updates.currencyCode = currencyCode;
  if (minOrderAmount !== undefined) updates.minOrderAmount = minOrderAmount ? parseFloat(minOrderAmount) : undefined;
  if (maxDiscountAmount !== undefined) updates.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined;
  if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : undefined;
  if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : undefined;
  if (isActive !== undefined) updates.isActive = isActive === 'true';
  if (isOneTimeUse !== undefined) updates.isOneTimeUse = isOneTimeUse === 'true';
  if (maxUsage !== undefined) updates.maxUsage = maxUsage ? parseInt(maxUsage) : undefined;
  if (maxUsagePerCustomer !== undefined) updates.maxUsagePerCustomer = maxUsagePerCustomer ? parseInt(maxUsagePerCustomer) : undefined;

  const _coupon = await manageCouponsUseCase.update(couponId, updates);

  res.redirect(`/hub/promotions/coupons/${couponId}?success=Coupon updated successfully`);
  
};

export const deleteCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  const { couponId } = req.params;

  const success = await manageCouponsUseCase.delete(couponId);

  if (!success) {
    throw new Error('Failed to delete coupon');
  }

  res.json({ success: true, message: 'Coupon deleted successfully' });
  
};

export const validateCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { code, orderTotal, customerId } = body;

  const result = await manageCouponsUseCase.validate(code, orderTotal, customerId, 'default-organization');

  res.json({
    valid: result.valid,
    coupon: result.coupon,
    message: result.message,
    discountAmount: result.coupon ? manageCouponsUseCase.calculateDiscount(result.coupon, orderTotal) : 0,
  });
  
};
