import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { CategoryPromotionRepo } from '../../infrastructure/repositories/categoryRepo';

const categoryPromotionRepo = new CategoryPromotionRepo();

export const getActiveCategoryPromotions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const promotions = await categoryPromotionRepo.getActivePromotions();
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get promotions by category ID
export const getPromotionsByCategoryId = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const promotions = await categoryPromotionRepo.getByCategoryId(categoryId);
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get promotion by ID
export const getCategoryPromotionById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotion = await categoryPromotionRepo.getById(id);

    if (!promotion) {
      res.status(404).json({ success: false, message: 'Category promotion not found' });
      return;
    }

    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new category promotion
export const createCategoryPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const promotionData = req.body;

    // Add audit fields
    promotionData.createdBy = req.user?.id || 'system';
    promotionData.updatedBy = req.user?.id || 'system';

    const promotion = await categoryPromotionRepo.create(promotionData);
    res.status(201).json({ success: true, data: promotion });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing category promotion
export const updateCategoryPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotionData = req.body;

    const promotion = await categoryPromotionRepo.update(id, promotionData);
    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a category promotion
export const deleteCategoryPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await categoryPromotionRepo.delete(id);
    res.status(200).json({ success: true, message: 'Category promotion deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
