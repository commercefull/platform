import { Request, Response } from "express";
import { CartPromotionRepo } from "../repos/cartRepo";

const cartPromotionRepo = new CartPromotionRepo();

// Get cart promotions by cart ID
export const getPromotionsByCartId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cartId } = req.params;
    const promotions = await cartPromotionRepo.getByCartId(cartId);
    res.status(200).json({ success: true, data: promotions || [] });
  } catch (error: any) {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a cart promotion
export const updateCartPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotionData = req.body;

    // Add audit fields
    promotionData.updatedBy = (req.user as any)?.id || 'system';

    const promotion = await cartPromotionRepo.update(promotionData, id);
    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a promotion from a cart
export const removePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedBy = (req.user as any)?.id || 'system';

    await cartPromotionRepo.delete(id, deletedBy);
    res.status(200).json({ success: true, message: "Cart promotion removed successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
