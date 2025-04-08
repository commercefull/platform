import { Request, Response } from "express";
import { CouponRepo } from "../repos/coupon";

const couponRepo = new CouponRepo();

export const getActiveCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupons = await couponRepo.findActiveCoupons();
    res.status(200).json({ success: true, data: coupons || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get coupon by ID
export const getCouponById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await couponRepo.getById(id);

    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }

    res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get coupon by code
export const getCouponByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const coupon = await couponRepo.getByCode(code);

    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }

    res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new coupon
export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const couponData = req.body;

    // Add audit fields
    couponData.createdBy = (req.user as any)?.id || 'system';
    couponData.updatedBy = (req.user as any)?.id || 'system';

    const coupon = await couponRepo.create(couponData);
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing coupon
export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const couponData = req.body;

    // Add audit fields
    couponData.updatedBy = (req.user as any)?.id || 'system';

    const coupon = await couponRepo.update(couponData, id);
    res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a coupon
export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedBy = (req.user as any)?.id || 'system';

    await couponRepo.delete(id, deletedBy);
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
