import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import discountRepo, { CreateProductDiscountInput, UpdateProductDiscountInput } from '../../infrastructure/repositories/discountRepo';

// Get all active discounts
export const getActiveDiscounts = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.query;
    const discounts = await discountRepo.findActive(organizationId as string | undefined);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get discounts by product ID
export const getDiscountsByProductId = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { organizationId } = req.query;
    const discounts = await discountRepo.findDiscountsForProduct(productId, organizationId as string | undefined);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get discounts by category ID
export const getDiscountsByCategoryId = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { organizationId } = req.query;
    const discounts = await discountRepo.findDiscountsForCategory(categoryId, organizationId as string | undefined);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get discount by ID
export const getDiscountById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const discount = await discountRepo.findById(id);

    if (!discount) {
      res.status(404).json({ success: false, message: 'Discount not found' });
      return;
    }

    res.status(200).json({ success: true, data: discount });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Create a new discount
export const createDiscount = async (req: TypedRequest<Record<string, string>, unknown, CreateProductDiscountInput>, res: Response): Promise<void> => {
  try {
    const discountData = req.body;

    // Validate required fields
    if (!discountData.name || !discountData.discountType || discountData.discountValue === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields: name, discountType, and discountValue are required' });
      return;
    }

    const discount = await discountRepo.create(discountData);
    res.status(201).json({ success: true, data: discount });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Update an existing discount
export const updateDiscount = async (req: TypedRequest<Record<string, string>, unknown, UpdateProductDiscountInput>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const discountData = req.body;

    const discount = await discountRepo.update(id, discountData);
    res.status(200).json({ success: true, data: discount });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Delete a discount
export const deleteDiscount = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await discountRepo.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Discount not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Discount deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
