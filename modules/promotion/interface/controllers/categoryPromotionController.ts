import { jsonResponse } from 'libs/apiResponse';
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
  jsonResponse(res, 200, { success: true, data: promotions || [] });
};

// Get promotions by category ID
export const getPromotionsByCategoryId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { categoryId } = req.params;
  const promotions = await managePromotionTargetsUseCase.getCategoryPromotionsByCategoryId(categoryId);
  jsonResponse(res, 200, { success: true, data: promotions || [] });
};

// Get promotion by ID
export const getCategoryPromotionById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const promotion = await managePromotionTargetsUseCase.getCategoryPromotionById(id);

  if (!promotion) {
    jsonResponse(res, 404, { success: false, message: 'Category promotion not found' });
    return;
  }

  jsonResponse(res, 200, { success: true, data: promotion });
};

// Create a new category promotion
export const createCategoryPromotion = async (
  req: HttpRequest<Record<string, string>, unknown, CategoryCreateBody>,
  res: HttpResponse,
): Promise<void> => {
  const promotionData = req.body;

  const promotion = await managePromotionTargetsUseCase.createCategoryPromotion(promotionData);
  jsonResponse(res, 201, { success: true, data: promotion });
};

// Update an existing category promotion
export const updateCategoryPromotion = async (
  req: HttpRequest<Record<string, string>, unknown, CategoryUpdateBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const promotionData = req.body;

  const promotion = await managePromotionTargetsUseCase.updateCategoryPromotion(id, promotionData);
  jsonResponse(res, 200, { success: true, data: promotion });
};

// Delete a category promotion
export const deleteCategoryPromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  await managePromotionTargetsUseCase.deleteCategoryPromotion(id);
  jsonResponse(res, 200, { success: true, message: 'Category promotion deleted successfully' });
};
