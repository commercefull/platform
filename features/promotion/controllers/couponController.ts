import { Request, Response } from "express";
import couponRepo, { 
  CouponStatus, 
  CreateCouponInput, 
  UpdateCouponInput 
} from "../repos/couponRepo";

/**
 * Get all active coupons
 */
export const getActiveCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId, limit, offset, orderBy, direction } = req.query;
    
    const coupons = await couponRepo.findActiveCoupons(
      merchantId as string | undefined,
      {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        orderBy: orderBy as string | undefined,
        direction: direction as 'ASC' | 'DESC' | undefined
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: coupons || [],
      pagination: {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await couponRepo.findById(id);

    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }

    res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get coupon by code
 */
export const getCouponByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { merchantId } = req.query;
    
    const coupon = await couponRepo.findByCode(code, merchantId as string | undefined);

    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }

    res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new coupon
 */
export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const couponData: CreateCouponInput = req.body;
    
    // Validate required fields
    if (!couponData.code || !couponData.name || !couponData.type || couponData.value === undefined || !couponData.startDate) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }
    
    // Check if code already exists
    const existingCoupon = await couponRepo.findByCode(couponData.code, couponData.merchantId);
    if (existingCoupon) {
      res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
      return;
    }
    
    // Set default values if not provided
    if (couponData.forNewCustomersOnly === undefined) {
      couponData.forNewCustomersOnly = false;
    }
    
    if (couponData.forAutoApply === undefined) {
      couponData.forAutoApply = false;
    }
    
    if (!couponData.status) {
      couponData.status = CouponStatus.ACTIVE;
    }
    
    const coupon = await couponRepo.create(couponData);
    
    res.status(201).json({ 
      success: true, 
      data: coupon,
      message: 'Coupon created successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update an existing coupon
 */
export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const couponData: UpdateCouponInput = req.body;
    
    // Check if coupon exists
    const existingCoupon = await couponRepo.findById(id);
    if (!existingCoupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }
    
    // Check if code is being changed and if it already exists
    if (couponData.code && couponData.code !== existingCoupon.code) {
      const codeExists = await couponRepo.findByCode(
        couponData.code, 
        couponData.merchantId || existingCoupon.merchantId
      );
      
      if (codeExists) {
        res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
        return;
      }
    }
    
    const updatedCoupon = await couponRepo.update(id, couponData);
    
    res.status(200).json({ 
      success: true, 
      data: updatedCoupon,
      message: 'Coupon updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a coupon
 */
export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if coupon exists
    const existingCoupon = await couponRepo.findById(id);
    if (!existingCoupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }
    
    await couponRepo.delete(id);
    
    res.status(200).json({ 
      success: true, 
      message: "Coupon deleted successfully" 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Validate a coupon for a cart
 */
export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, customerId, merchantId } = req.body;
    
    // Validation
    if (!code || orderTotal === undefined) {
      res.status(400).json({
        success: false,
        message: 'Coupon code and order total are required'
      });
      return;
    }
    
    // Validate the coupon
    const result = await couponRepo.validateCoupon(
      code,
      parseFloat(orderTotal),
      customerId,
      merchantId
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get coupon usage
 */
export const getCouponUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if coupon exists
    const existingCoupon = await couponRepo.findById(id);
    if (!existingCoupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }
    
    const usage = await couponRepo.getCouponUsage(id);
    
    res.status(200).json({
      success: true,
      data: {
        coupon: existingCoupon,
        usage,
        totalUsage: existingCoupon.usageCount,
        remainingUsage: existingCoupon.usageLimit 
          ? existingCoupon.usageLimit - existingCoupon.usageCount 
          : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Calculate coupon discount for a cart
 */
export const calculateCouponDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, items, merchantId } = req.body;
    
    // Validation
    if (!code || orderTotal === undefined) {
      res.status(400).json({
        success: false,
        message: 'Coupon code and order total are required'
      });
      return;
    }
    
    // Get coupon
    const coupon = await couponRepo.findByCode(code, merchantId);
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }
    
    // Calculate discount
    const discountAmount = await couponRepo.calculateCouponDiscount(
      coupon,
      parseFloat(orderTotal),
      items
    );
    
    res.status(200).json({
      success: true,
      data: {
        coupon,
        orderTotal: parseFloat(orderTotal),
        discountAmount,
        finalTotal: parseFloat(orderTotal) - discountAmount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getActiveCoupons,
  getCouponById,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponUsage,
  calculateCouponDiscount
};
