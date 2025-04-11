import { Request, Response } from "express";
import { DiscountRepo } from "../repos/discountRepo";

const discountRepo = new DiscountRepo();

// Get all active discounts
export const getActiveDiscounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const discounts = await discountRepo.getActiveDiscounts();
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get discounts by product ID
export const getDiscountsByProductId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const discounts = await discountRepo.getDiscountsByProductId(productId);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get discounts by category ID
export const getDiscountsByCategoryId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const discounts = await discountRepo.getDiscountsByCategoryId(categoryId);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get discount by ID
export const getDiscountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const discount = await discountRepo.getById(id);
    
    if (!discount) {
      res.status(404).json({ success: false, message: "Discount not found" });
      return;
    }
    
    res.status(200).json({ success: true, data: discount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new discount
export const createDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const discountData = req.body;
    
    // Add audit fields
    discountData.createdBy = (req.user as any)?.id || 'system';
    discountData.updatedBy = (req.user as any)?.id || 'system';
    
    const discount = await discountRepo.create(discountData);
    res.status(201).json({ success: true, data: discount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing discount
export const updateDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const discountData = req.body;
    
    // Add audit fields
    discountData.updatedBy = (req.user as any)?.id || 'system';
    
    const discount = await discountRepo.update(discountData, id);
    res.status(200).json({ success: true, data: discount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a discount
export const deleteDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedBy = (req.user as any)?.id || 'system';
    
    await discountRepo.delete(id, deletedBy);
    res.status(200).json({ success: true, message: "Discount deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
