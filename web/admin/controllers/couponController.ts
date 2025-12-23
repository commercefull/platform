/**
 * Coupon Controller
 * Handles coupon management for the Admin Hub
 */

import { Request, Response } from 'express';
import { couponRepo } from '../../../modules/promotion/repos/couponRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// Coupon Management
// ============================================================================

export const listCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const coupons = await couponRepo.findAll('default-merchant', {
      isActive,
      limit,
      offset
    });

    // Get active coupons count for stats
    const activeCoupons = await couponRepo.findActiveCoupons('default-merchant');

    adminRespond(req, res, 'promotions/coupons/index', {
      pageName: 'Coupon Management',
      coupons,
      activeCoupons: activeCoupons.length,
      filters: { status, isActive },
      pagination: { limit, offset },
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing coupons:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load coupons',
    });
  }
};

export const createCouponForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'promotions/coupons/create', {
      pageName: 'Create Coupon',
    });
  } catch (error: any) {
    console.error('Error loading create coupon form:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
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
      maxUsagePerCustomer
    } = req.body;

    const coupon = await couponRepo.create({
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
      merchantId: 'default-merchant'
    });

    res.redirect(`/hub/promotions/coupons/${coupon.promotionCouponId}?success=Coupon created successfully`);
  } catch (error: any) {
    console.error('Error creating coupon:', error);

    adminRespond(req, res, 'promotions/coupons/create', {
      pageName: 'Create Coupon',
      error: error.message || 'Failed to create coupon',
      formData: req.body,
    });
  }
};

export const viewCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;

    const coupon = await couponRepo.findById(couponId);

    if (!coupon) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Coupon not found',
      });
      return;
    }

    // Get usage records
    const usage = await couponRepo.getUsage(couponId);

    adminRespond(req, res, 'promotions/coupons/view', {
      pageName: `Coupon: ${coupon.name}`,
      coupon,
      usage,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing coupon:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load coupon',
    });
  }
};

export const editCouponForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;

    const coupon = await couponRepo.findById(couponId);

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
  } catch (error: any) {
    console.error('Error loading edit coupon form:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;
    const updates: any = {};

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
      maxUsagePerCustomer
    } = req.body;

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

    const coupon = await couponRepo.update(couponId, updates);

    res.redirect(`/hub/promotions/coupons/${couponId}?success=Coupon updated successfully`);
  } catch (error: any) {
    console.error('Error updating coupon:', error);

    try {
      const coupon = await couponRepo.findById(req.params.couponId);

      adminRespond(req, res, 'promotions/coupons/edit', {
        pageName: `Edit: ${coupon?.name || 'Coupon'}`,
        coupon,
        error: error.message || 'Failed to update coupon',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update coupon',
      });
    }
  }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;

    const success = await couponRepo.delete(couponId);

    if (!success) {
      throw new Error('Failed to delete coupon');
    }

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete coupon' });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, customerId } = req.body;

    const result = await couponRepo.validate(code, orderTotal, customerId, 'default-merchant');

    res.json({
      valid: result.valid,
      coupon: result.coupon,
      message: result.message,
      discountAmount: result.coupon ? couponRepo.calculateDiscount(result.coupon, orderTotal) : 0
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ valid: false, message: error.message || 'Failed to validate coupon' });
  }
};
