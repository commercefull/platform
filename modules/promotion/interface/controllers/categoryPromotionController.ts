import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';

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

const categoryPromotionRepo = promotionRuleRepository.categories;

export const getActiveCategoryPromotions = async (req: TypedRequest, res: Response): Promise<void> => {
  const promotions = await categoryPromotionRepo.getActivePromotions();
  res.status(200).json({ success: true, data: promotions || [] });
  
};

// Get promotions by category ID
export const getPromotionsByCategoryId = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  const promotions = await categoryPromotionRepo.getByCategoryId(categoryId);
  res.status(200).json({ success: true, data: promotions || [] });
  
};

// Get promotion by ID
export const getCategoryPromotionById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const promotion = await categoryPromotionRepo.getById(id);

  if (!promotion) {
    res.status(404).json({ success: false, message: 'Category promotion not found' });
    return;
  }

  res.status(200).json({ success: true, data: promotion });
  
};

// Create a new category promotion
export const createCategoryPromotion = async (req: TypedRequest<Record<string, string>, unknown, CategoryCreateBody>, res: Response): Promise<void> => {
  const promotionData = req.body;

  const promotion = await categoryPromotionRepo.create(promotionData);
  res.status(201).json({ success: true, data: promotion });
  
};

// Update an existing category promotion
export const updateCategoryPromotion = async (req: TypedRequest<Record<string, string>, unknown, CategoryUpdateBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const promotionData = req.body;

  const promotion = await categoryPromotionRepo.update(id, promotionData);
  res.status(200).json({ success: true, data: promotion });
  
};

// Delete a category promotion
export const deleteCategoryPromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await categoryPromotionRepo.delete(id);
  res.status(200).json({ success: true, message: 'Category promotion deleted successfully' });
  
};
