import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import promotionRepo, {
  CreatePromotionInput,
  PromotionScope,
  PromotionStatus,
  UpdatePromotionInput,
} from '../../infrastructure/repositories/promotionRepo';

interface ApplyPromotionBody {
  cartId: string;
  promotionId: string;
}

interface ValidatePromotionBody {
  promotionId: string;
  cartTotal: string;
  customerId?: string;
  items?: unknown[];
}

/**
 * Get all active promotions with optional filtering
 */
export const getActivePromotions = async (req: TypedRequest, res: Response): Promise<void> => {
  const { scope, organizationId } = req.query;

  // Handle scope as array or single value
  let scopeFilter: PromotionScope | PromotionScope[] | undefined = undefined;
  if (scope) {
    if (Array.isArray(scope)) {
      scopeFilter = scope as PromotionScope[];
    } else {
      scopeFilter = scope as PromotionScope;
    }
  }

  const promotions = await promotionRepo.findActive(scopeFilter, organizationId as string | undefined);

  res.status(200).json({
    success: true,
    data: promotions,
  });
  
};

/**
 * Get all promotions with filtering and pagination
 */
export const getPromotions = async (req: TypedRequest, res: Response): Promise<void> => {
  const {
    status,
    scope,
    organizationId,
    withCoupon,
    startBefore,
    endAfter,
    limit = '50',
    offset = '0',
    orderBy = 'priority',
    direction = 'DESC',
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
      organizationId: organizationId as string | undefined,
      isActive: withCoupon === 'true' ? true : withCoupon === 'false' ? false : undefined,
      startBefore: startBefore ? new Date(startBefore as string) : undefined,
      endAfter: endAfter ? new Date(endAfter as string) : undefined,
    },
    {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      orderBy: orderBy as string,
      direction: direction as 'ASC' | 'DESC',
    },
  );

  res.status(200).json({
    success: true,
    data: promotions,
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
  
};

/**
 * Get a promotion by ID with its rules and actions
 */
export const getPromotionById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const promotionData = await promotionRepo.getWithDetails(id);

  if (!promotionData) {
    res.status(404).json({
      success: false,
      message: 'Promotion not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: promotionData,
  });
  
};

/**
 * Create a new promotion with rules and actions
 */
export const createPromotion = async (req: TypedRequest<Record<string, string>, unknown, CreatePromotionInput>, res: Response): Promise<void> => {
  const promotionData = req.body;

  // Validate required fields
  if (!promotionData.name || !promotionData.status || !promotionData.scope || !promotionData.startDate) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields',
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
    message: 'Promotion created successfully',
  });
  
};

/**
 * Update an existing promotion
 */
export const updatePromotion = async (req: TypedRequest<Record<string, string>, unknown, UpdatePromotionInput>, res: Response): Promise<void> => {
  const { id } = req.params;
  const promotionData = req.body;

  // Check if promotion exists
  const existingPromotion = await promotionRepo.findById(id);

  if (!existingPromotion) {
    res.status(404).json({
      success: false,
      message: 'Promotion not found',
    });
    return;
  }

  // Update the promotion
  const updatedPromotion = await promotionRepo.update(id, promotionData);

  res.status(200).json({
    success: true,
    data: updatedPromotion,
    message: 'Promotion updated successfully',
  });
  
};

/**
 * Delete a promotion
 */
export const deletePromotion = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if promotion exists
  const existingPromotion = await promotionRepo.findById(id);

  if (!existingPromotion) {
    res.status(404).json({
      success: false,
      message: 'Promotion not found',
    });
    return;
  }

  // Delete the promotion
  const deleted = await promotionRepo.delete(id);

  if (!deleted) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete promotion',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Promotion deleted successfully',
  });
  
};

/**
 * Apply a promotion to a cart
 */
const _applyPromotionToCart = async (req: TypedRequest<Record<string, string>, unknown, ApplyPromotionBody>, res: Response): Promise<void> => {
  const { cartId, promotionId } = req.body;

  // Validation
  if (!cartId || !promotionId) {
    res.status(400).json({
      success: false,
      message: 'Cart ID and Promotion ID are required',
    });
    return;
  }

  // Check if promotion exists and is active
  const promotionData = await promotionRepo.getWithDetails(promotionId);

  if (!promotionData || promotionData.promotion.status !== 'active') {
    res.status(404).json({
      success: false,
      message: 'Promotion not found or not active',
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
      promotion: promotionData.promotion,
    },
  });
  
};

/**
 * Remove a promotion from a cart
 */
const _removePromotionFromCart = async (req: TypedRequest, res: Response): Promise<void> => {
  const { cartId, promotionId } = req.params;

  // Validation
  if (!cartId || !promotionId) {
    res.status(400).json({
      success: false,
      message: 'Cart ID and Promotion ID are required',
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
      promotionId,
    },
  });
  
};

/**
 * Validate a promotion for a cart
 */
const _validatePromotionForCart = async (req: TypedRequest<Record<string, string>, unknown, ValidatePromotionBody>, res: Response): Promise<void> => {
  const { promotionId, cartTotal, customerId, items: _items } = req.body;

  // Validation
  if (!promotionId || cartTotal === undefined) {
    res.status(400).json({
      success: false,
      message: 'Promotion ID and cart total are required',
    });
    return;
  }

  // Validate the promotion
  const isValid = await promotionRepo.isValidForOrder(promotionId, parseFloat(cartTotal), customerId);

  if (isValid) {
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        promotionId,
      },
      message: 'Promotion is valid for this cart',
    });
  } else {
    res.status(200).json({
      success: true,
      data: {
        valid: false,
        promotionId,
      },
      message: 'Promotion is not valid for this cart',
    });
  }
  
};

/**
 * Activate a promotion
 */
export const activatePromotion = async (req: TypedRequest, res: Response): Promise<void> => {
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
    message: 'Promotion activated successfully',
  });
  
};

/**
 * Pause a promotion
 */
export const pausePromotion = async (req: TypedRequest, res: Response): Promise<void> => {
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
    message: 'Promotion paused successfully',
  });
  
};
