import { jsonResponse } from "libs/apiResponse";
import type { HttpRequest, HttpResponse } from 'libs/http';
import { managePromotionTargetsUseCase, type CreateProductDiscountInput, type UpdateProductDiscountInput } from '../../application/wired';

// Get all active discounts
export const getActiveDiscounts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.query;
  const discounts = await managePromotionTargetsUseCase.findActiveProductDiscounts(organizationId as string | undefined);
  jsonResponse(res, 200, { success: true, data: discounts || [] });
};

// Get discounts by product ID
export const getDiscountsByProductId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { organizationId } = req.query;
  const discounts = await managePromotionTargetsUseCase.findDiscountsForProduct(productId, organizationId as string | undefined);
  jsonResponse(res, 200, { success: true, data: discounts || [] });
};

// Get discounts by category ID
export const getDiscountsByCategoryId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { categoryId } = req.params;
  const { organizationId } = req.query;
  const discounts = await managePromotionTargetsUseCase.findDiscountsForCategory(categoryId, organizationId as string | undefined);
  jsonResponse(res, 200, { success: true, data: discounts || [] });
};

// Get discount by ID
export const getDiscountById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const discount = await managePromotionTargetsUseCase.findProductDiscountById(id);

  if (!discount) {
    jsonResponse(res, 404, { success: false, message: 'Discount not found' });
    return;
  }

  jsonResponse(res, 200, { success: true, data: discount });
};

// Create a new discount
export const createDiscount = async (
  req: HttpRequest<Record<string, string>, unknown, CreateProductDiscountInput>,
  res: HttpResponse,
): Promise<void> => {
  const discountData = req.body;

  // Validate required fields
  if (!discountData.name || !discountData.discountType || discountData.discountValue === undefined) {
    jsonResponse(res, 400, { success: false, message: 'Missing required fields: name, discountType, and discountValue are required' });
    return;
  }

  const discount = await managePromotionTargetsUseCase.createProductDiscount(discountData);
  jsonResponse(res, 201, { success: true, data: discount });
};

// Update an existing discount
export const updateDiscount = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateProductDiscountInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const discountData = req.body;

  const discount = await managePromotionTargetsUseCase.updateProductDiscount(id, discountData);
  jsonResponse(res, 200, { success: true, data: discount });
};

// Delete a discount
export const deleteDiscount = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const deleted = await managePromotionTargetsUseCase.deleteProductDiscount(id);
  if (!deleted) {
    jsonResponse(res, 404, { success: false, message: 'Discount not found' });
    return;
  }

  jsonResponse(res, 200, { success: true, message: 'Discount deleted successfully' });
};
