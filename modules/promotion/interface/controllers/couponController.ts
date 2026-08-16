import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import couponRepo, { CreateCouponInput, UpdateCouponInput } from '../../infrastructure/repositories/couponRepo';

interface ValidateCouponBody {
  code: string;
  orderTotal: string;
  customerId?: string;
  merchantId?: string;
}

interface CalculateDiscountBody {
  code: string;
  orderTotal: string;
  items?: unknown[];
  merchantId?: string;
}

/**
 * Get all active coupons
 */
export const getActiveCoupons = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, limit, offset, orderBy, direction } = req.query;

    const coupons = await couponRepo.findActiveCoupons(merchantId as string | undefined, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      orderBy: orderBy as string | undefined,
      direction: direction as 'ASC' | 'DESC' | undefined,
    });

    res.status(200).json({
      success: true,
      data: coupons || [],
      pagination: {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await couponRepo.findById(id);

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({ success: true, data: coupon });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Get coupon by code
 */
export const getCouponByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { merchantId } = req.query;

    const coupon = await couponRepo.findByCode(code, merchantId as string | undefined);

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({ success: true, data: coupon });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Create a new coupon
 */
export const createCoupon = async (req: TypedRequest<Record<string, string>, unknown, CreateCouponInput>, res: Response): Promise<void> => {
  try {
    const couponData = req.body;

    // Validate required fields
    if (!couponData.code || !couponData.name || !couponData.type) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: code, name, and type are required',
      });
      return;
    }

    // Check if code already exists
    const existingCoupon = await couponRepo.findByCode(couponData.code, couponData.merchantId);
    if (existingCoupon) {
      res.status(400).json({
        success: false,
        message: 'Coupon code already exists',
      });
      return;
    }

    // Default values are handled by the repository

    const coupon = await couponRepo.create(couponData);

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Update an existing coupon
 */
export const updateCoupon = async (req: TypedRequest<Record<string, string>, unknown, UpdateCouponInput>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const couponData = req.body;

    // Check if coupon exists
    const existingCoupon = await couponRepo.findById(id);
    if (!existingCoupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
      return;
    }

    // Code cannot be changed via update (it's excluded from UpdateCouponInput)

    const updatedCoupon = await couponRepo.update(id, couponData);

    res.status(200).json({
      success: true,
      data: updatedCoupon,
      message: 'Coupon updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Delete a coupon
 */
export const deleteCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const existingCoupon = await couponRepo.findById(id);
    if (!existingCoupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
      return;
    }

    await couponRepo.delete(id);

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Validate a coupon for a cart
 */
export const validateCoupon = async (req: TypedRequest<Record<string, string>, unknown, ValidateCouponBody>, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, customerId, merchantId } = req.body;

    // Validation
    if (!code || orderTotal === undefined) {
      res.status(400).json({
        success: false,
        message: 'Coupon code and order total are required',
      });
      return;
    }

    // Validate the coupon
    const result = await couponRepo.validate(code, parseFloat(orderTotal), customerId, merchantId);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        data: result,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Get coupon usage
 */
export const getCouponUsage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const existingCoupon = await couponRepo.findById(id);
    if (!existingCoupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
      return;
    }

    const usage = await couponRepo.getUsage(id);

    res.status(200).json({
      success: true,
      data: {
        coupon: existingCoupon,
        usage,
        totalUsage: existingCoupon.usageCount,
        remainingUsage: existingCoupon.maxUsage ? existingCoupon.maxUsage - existingCoupon.usageCount : null,
      },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Calculate coupon discount for a cart
 */
export const calculateCouponDiscount = async (req: TypedRequest<Record<string, string>, unknown, CalculateDiscountBody>, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, items: _items, merchantId } = req.body;

    // Validation
    if (!code || orderTotal === undefined) {
      res.status(400).json({
        success: false,
        message: 'Coupon code and order total are required',
      });
      return;
    }

    // Get coupon
    const coupon = await couponRepo.findByCode(code, merchantId);
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
      return;
    }

    // Calculate discount
    const discountAmount = couponRepo.calculateDiscount(coupon, parseFloat(orderTotal));

    res.status(200).json({
      success: true,
      data: {
        coupon,
        orderTotal: parseFloat(orderTotal),
        discountAmount,
        finalTotal: parseFloat(orderTotal) - discountAmount,
      },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
