import type { HttpRequest, HttpResponse } from 'libs/http';
import { managePromotionTargetsUseCase } from '../../application/wired';

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

export const getActiveCategoryPromotions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const promotions = await managePromotionTargetsUseCase.getActiveCategoryPromotions();
  res.status(200).json({ success: true, data: promotions || [] });
};

// Get promotions by category ID
export const getPromotionsByCategoryId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { categoryId } = req.params;
  const promotions = await managePromotionTargetsUseCase.getCategoryPromotionsByCategoryId(categoryId);
  res.status(200).json({ success: true, data: promotions || [] });
};

// Get promotion by ID
export const getCategoryPromotionById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const promotion = await managePromotionTargetsUseCase.getCategoryPromotionById(id);

  if (!promotion) {
    res.status(404).json({ success: false, message: 'Category promotion not found' });
    return;
  }

  res.status(200).json({ success: true, data: promotion });
};

// Create a new category promotion
export const createCategoryPromotion = async (
  req: HttpRequest<Record<string, string>, unknown, CategoryCreateBody>,
  res: HttpResponse,
): Promise<void> => {
  const promotionData = req.body;

  const promotion = await managePromotionTargetsUseCase.createCategoryPromotion(promotionData);
  res.status(201).json({ success: true, data: promotion });
};

// Update an existing category promotion
export const updateCategoryPromotion = async (
  req: HttpRequest<Record<string, string>, unknown, CategoryUpdateBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const promotionData = req.body;

  const promotion = await managePromotionTargetsUseCase.updateCategoryPromotion(id, promotionData);
  res.status(200).json({ success: true, data: promotion });
};

// Delete a category promotion
export const deleteCategoryPromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  await managePromotionTargetsUseCase.deleteCategoryPromotion(id);
  res.status(200).json({ success: true, message: 'Category promotion deleted successfully' });
};
