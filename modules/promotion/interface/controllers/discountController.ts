import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import discountRepo, { CreateProductDiscountInput, UpdateProductDiscountInput } from '../../infrastructure/repositories/discountRepo';

// Get all active discounts
export const getActiveDiscounts = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.query;
    const discounts = await discountRepo.findActive(merchantId as string | undefined);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get discounts by product ID
export const getDiscountsByProductId = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { merchantId } = req.query;
    const discounts = await discountRepo.findDiscountsForProduct(productId, merchantId as string | undefined);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get discounts by category ID
export const getDiscountsByCategoryId = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { merchantId } = req.query;
    const discounts = await discountRepo.findDiscountsForCategory(categoryId, merchantId as string | undefined);
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
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
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new discount
export const createDiscount = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const discountData: CreateProductDiscountInput = req.body;

    // Validate required fields
    if (!discountData.name || !discountData.discountType || discountData.discountValue === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields: name, discountType, and discountValue are required' });
      return;
    }

    const discount = await discountRepo.create(discountData);
    res.status(201).json({ success: true, data: discount });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing discount
export const updateDiscount = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const discountData: UpdateProductDiscountInput = req.body;

    const discount = await discountRepo.update(id, discountData);
    res.status(200).json({ success: true, data: discount });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
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
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
