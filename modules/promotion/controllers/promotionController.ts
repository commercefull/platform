import { logger } from '../../../libs/logger';
import { Request, Response } from "express";
import promotionRepo, {
  CreatePromotionInput,
  PromotionScope,
  PromotionStatus,
  UpdatePromotionInput
} from "../repos/promotionRepo";

/**
 * Get all active promotions with optional filtering
 */
export const getActivePromotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scope, merchantId } = req.query;
    
    // Handle scope as array or single value
    let scopeFilter: PromotionScope | PromotionScope[] | undefined = undefined;
    if (scope) {
      if (Array.isArray(scope)) {
        scopeFilter = scope as PromotionScope[];
      } else {
        scopeFilter = scope as PromotionScope;
      }
    }
    
    const promotions = await promotionRepo.findActive(
      scopeFilter,
      merchantId as string | undefined
    );
    
    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching active promotions'
    });
  }
};

/**
 * Get all promotions with filtering and pagination
 */
export const getPromotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      scope,
      merchantId,
      withCoupon,
      startBefore,
      endAfter,
      limit = '50',
      offset = '0',
      orderBy = 'priority',
      direction = 'DESC'
    } = req.query;
    
    // Convert string parameters to appropriate types
    let statusFilter: PromotionStatus | PromotionStatus[] | undefined = undefined;
    if (status) {
      if (Array.isArray(status)) {
        statusFilter = status as PromotionStatus[];
      } else {
        statusFilter = status as PromotionStatus;
      }
    }
    
    let scopeFilter: PromotionScope | PromotionScope[] | undefined = undefined;
    if (scope) {
      if (Array.isArray(scope)) {
        scopeFilter = scope as PromotionScope[];
      } else {
        scopeFilter = scope as PromotionScope;
      }
    }
    
    const promotions = await promotionRepo.findAll(
      {
        status: statusFilter,
        scope: scopeFilter,
        merchantId: merchantId as string | undefined,
        isActive: withCoupon === 'true' ? true : withCoupon === 'false' ? false : undefined,
        startBefore: startBefore ? new Date(startBefore as string) : undefined,
        endAfter: endAfter ? new Date(endAfter as string) : undefined
      },
      {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        orderBy: orderBy as string,
        direction: direction as 'ASC' | 'DESC'
      }
    );
    
    res.status(200).json({
      success: true,
      data: promotions,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching promotions'
    });
  }
};

/**
 * Get a promotion by ID with its rules and actions
 */
export const getPromotionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const promotionData = await promotionRepo.getWithDetails(id);
    
    if (!promotionData) {
      res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: promotionData
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching the promotion'
    });
  }
};

/**
 * Create a new promotion with rules and actions
 */
export const createPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotionData: CreatePromotionInput = req.body;
    
    // Validate required fields
    if (!promotionData.name || !promotionData.status || !promotionData.scope || !promotionData.startDate) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }
    
    // Set default values if not provided
    if (promotionData.priority === undefined) {
      promotionData.priority = 10; // Default priority
    }
    
    if (promotionData.isExclusive === undefined) {
      promotionData.isExclusive = false; // Default non-exclusive
    }
    
    // Create the promotion
    const promotion = await promotionRepo.create(promotionData);
    
    res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully'
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while creating the promotion'
    });
  }
};

/**
 * Update an existing promotion
 */
export const updatePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotionData: UpdatePromotionInput = req.body;
    
    // Check if promotion exists
    const existingPromotion = await promotionRepo.findById(id);
    
    if (!existingPromotion) {
      res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
      return;
    }
    
    // Update the promotion
    const updatedPromotion = await promotionRepo.update(id, promotionData);
    
    res.status(200).json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion updated successfully'
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while updating the promotion'
    });
  }
};

/**
 * Delete a promotion
 */
export const deletePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if promotion exists
    const existingPromotion = await promotionRepo.findById(id);
    
    if (!existingPromotion) {
      res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
      return;
    }
    
    // Delete the promotion
    const deleted = await promotionRepo.delete(id);
    
    if (!deleted) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete promotion'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the promotion'
    });
  }
};

/**
 * Apply a promotion to a cart
 */
export const applyPromotionToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cartId, promotionId } = req.body;
    
    // Validation
    if (!cartId || !promotionId) {
      res.status(400).json({
        success: false,
        message: 'Cart ID and Promotion ID are required'
      });
      return;
    }
    
    // Check if promotion exists and is active
    const promotionData = await promotionRepo.getWithDetails(promotionId);
    
    if (!promotionData || promotionData.promotion.status !== 'active') {
      res.status(404).json({
        success: false,
        message: 'Promotion not found or not active'
      });
      return;
    }
    
    // In a real implementation, we would:
    // 1. Get the cart details
    // 2. Validate the promotion for the cart (e.g., check minimum order amount)
    // 3. Apply the promotion to the cart
    // 4. Save the updated cart
    
    // For this example, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Promotion applied to cart successfully',
      data: {
        cartId,
        promotionId,
        // Include promotion details
        promotion: promotionData.promotion
      }
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while applying the promotion'
    });
  }
};

/**
 * Remove a promotion from a cart
 */
export const removePromotionFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cartId, promotionId } = req.params;
    
    // Validation
    if (!cartId || !promotionId) {
      res.status(400).json({
        success: false,
        message: 'Cart ID and Promotion ID are required'
      });
      return;
    }
    
    // In a real implementation, we would:
    // 1. Get the cart details
    // 2. Remove the promotion from the cart
    // 3. Save the updated cart
    
    // For this example, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Promotion removed from cart successfully',
      data: {
        cartId,
        promotionId
      }
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while removing the promotion'
    });
  }
};

/**
 * Validate a promotion for a cart
 */
export const validatePromotionForCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promotionId, cartTotal, customerId, items } = req.body;
    
    // Validation
    if (!promotionId || cartTotal === undefined) {
      res.status(400).json({
        success: false,
        message: 'Promotion ID and cart total are required'
      });
      return;
    }
    
    // Validate the promotion
    const isValid = await promotionRepo.isValidForOrder(
      promotionId,
      parseFloat(cartTotal),
      customerId
    );
    
    if (isValid) {
      res.status(200).json({
        success: true,
        data: {
          valid: true,
          promotionId
        },
        message: 'Promotion is valid for this cart'
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          valid: false,
          promotionId
        },
        message: 'Promotion is not valid for this cart'
      });
    }
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while validating the promotion'
    });
  }
};

/**
 * Activate a promotion
 */
export const activatePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingPromotion = await promotionRepo.findById(id);
    if (!existingPromotion) {
      res.status(404).json({ success: false, message: 'Promotion not found' });
      return;
    }
    
    const updatedPromotion = await promotionRepo.update(id, { status: 'active' as PromotionStatus });
    
    res.status(200).json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion activated successfully'
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while activating the promotion'
    });
  }
};

/**
 * Pause a promotion
 */
export const pausePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingPromotion = await promotionRepo.findById(id);
    if (!existingPromotion) {
      res.status(404).json({ success: false, message: 'Promotion not found' });
      return;
    }
    
    const updatedPromotion = await promotionRepo.update(id, { status: 'paused' as PromotionStatus });
    
    res.status(200).json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion paused successfully'
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while pausing the promotion'
    });
  }
};
