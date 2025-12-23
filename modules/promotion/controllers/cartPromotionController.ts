import { logger } from '../../../libs/logger';
import { Request, Response } from "express";
import { CartPromotionRepo } from "../repos/cartRepo";

const cartPromotionRepo = new CartPromotionRepo();

// Get cart promotions by basket ID
export const getPromotionsByCartId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cartId } = req.params;
    const promotions = await cartPromotionRepo.getByBasketId(cartId);
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get promotion by ID
export const getCartPromotionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotion = await cartPromotionRepo.getById(id);

    if (!promotion) {
      res.status(404).json({ success: false, message: "Cart promotion not found" });
      return;
    }

    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply a promotion to a cart
export const applyPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotionData = req.body;

    // Add audit fields
    promotionData.createdBy = (req.user as any)?.id || 'system';
    promotionData.updatedBy = (req.user as any)?.id || 'system';

    const promotion = await cartPromotionRepo.create(promotionData);
    res.status(201).json({ success: true, data: promotion });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a cart promotion
export const updateCartPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotionData = req.body;

    const promotion = await cartPromotionRepo.update(id, promotionData);
    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a promotion from a cart
export const removePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await cartPromotionRepo.delete(id);
    res.status(200).json({ success: true, message: "Cart promotion removed successfully" });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
