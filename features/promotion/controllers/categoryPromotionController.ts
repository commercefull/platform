import { Request, Response } from "express";
import { CategoryPromotionRepo } from "../repos/categoryRepo";

const categoryPromotionRepo = new CategoryPromotionRepo();

export const getActiveCategoryPromotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotions = await categoryPromotionRepo.getActivePromotions();
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get promotions by category ID
export const getPromotionsByCategoryId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const promotions = await categoryPromotionRepo.getByCategoryId(categoryId);
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get promotion by ID
export const getCategoryPromotionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotion = await categoryPromotionRepo.getById(id);

    if (!promotion) {
      res.status(404).json({ success: false, message: "Category promotion not found" });
      return;
    }

    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new category promotion
export const createCategoryPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotionData = req.body;

    // Add audit fields
    promotionData.createdBy = (req.user as any)?.id || 'system';
    promotionData.updatedBy = (req.user as any)?.id || 'system';

    const promotion = await categoryPromotionRepo.create(promotionData);
    res.status(201).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing category promotion
export const updateCategoryPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotionData = req.body;

    // Add audit fields
    promotionData.updatedBy = (req.user as any)?.id || 'system';

    const promotion = await categoryPromotionRepo.update(promotionData, id);
    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a category promotion
export const deleteCategoryPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedBy = (req.user as any)?.id || 'system';

    await categoryPromotionRepo.delete(id, deletedBy);
    res.status(200).json({ success: true, message: "Category promotion deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
