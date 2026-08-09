import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { PromotionCategoryRepo } from '../../infrastructure/repositories/categoryRepo';

interface CategoryCreateBody {
  productCategoryId: string;
  promotionId: string;
  displayOrder: number;
  bannerText?: string;
  bannerColor?: string;
  bannerBackgroundColor?: string;
  bannerImageUrl?: string;
  isDisplayedOnCategoryPage?: boolean;
  isDisplayedOnProductPage?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

type CategoryUpdateBody = Partial<Omit<CategoryCreateBody, 'productCategoryId' | 'promotionId'>>;

const categoryPromotionRepo = new PromotionCategoryRepo();

export const getActiveCategoryPromotions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const promotions = await categoryPromotionRepo.getActivePromotions();
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get promotions by category ID
export const getPromotionsByCategoryId = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const promotions = await categoryPromotionRepo.getByCategoryId(categoryId);
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
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
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Create a new category promotion
export const createCategoryPromotion = async (req: TypedRequest<Record<string, string>, unknown, CategoryCreateBody>, res: Response): Promise<void> => {
  try {
    const promotionData = req.body;

    const promotion = await categoryPromotionRepo.create(promotionData);
    res.status(201).json({ success: true, data: promotion });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Update an existing category promotion
export const updateCategoryPromotion = async (req: TypedRequest<Record<string, string>, unknown, CategoryUpdateBody>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotionData = req.body;

    const promotion = await categoryPromotionRepo.update(id, promotionData);
    res.status(200).json({ success: true, data: promotion });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Delete a category promotion
export const deleteCategoryPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await categoryPromotionRepo.delete(id);
    res.status(200).json({ success: true, message: 'Category promotion deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
