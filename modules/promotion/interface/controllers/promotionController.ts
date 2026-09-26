import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  CreatePromotionInput,
  PromotionScope,
  PromotionStatus,
  UpdatePromotionInput,
  createPromotionRecordUseCase,
  changePromotionStatusUseCase,
  managePromotionsUseCase,
} from '../../application/wired';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';

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
export const getActivePromotions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

  const promotions = await managePromotionsUseCase.findActive(scopeFilter, organizationId as string | undefined);

  res.status(200).json({
    success: true,
    data: promotions,
  });
};

/**
 * Get all promotions with filtering and pagination
 */
export const getPromotions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

  const promotions = await managePromotionsUseCase.findAll(
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
export const getPromotionById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const promotionData = await managePromotionsUseCase.getWithDetails(id);

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
export const createPromotion = async (
  req: HttpRequest<Record<string, string>, unknown, CreatePromotionInput>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const promotion = await createPromotionRecordUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Update an existing promotion
 */
export const updatePromotion = async (
  req: HttpRequest<Record<string, string>, unknown, UpdatePromotionInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const promotionData = req.body;

  // Check if promotion exists
  const existingPromotion = await managePromotionsUseCase.findById(id);

  if (!existingPromotion) {
    res.status(404).json({
      success: false,
      message: 'Promotion not found',
    });
    return;
  }

  // Update the promotion
  const updatedPromotion = await managePromotionsUseCase.update(id, promotionData);

  res.status(200).json({
    success: true,
    data: updatedPromotion,
    message: 'Promotion updated successfully',
  });
};

/**
 * Delete a promotion
 */
export const deletePromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if promotion exists
  const existingPromotion = await managePromotionsUseCase.findById(id);

  if (!existingPromotion) {
    res.status(404).json({
      success: false,
      message: 'Promotion not found',
    });
    return;
  }

  // Delete the promotion
  const deleted = await managePromotionsUseCase.delete(id);

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
const _applyPromotionToCart = async (
  req: HttpRequest<Record<string, string>, unknown, ApplyPromotionBody>,
  res: HttpResponse,
): Promise<void> => {
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
  const promotionData = await managePromotionsUseCase.getWithDetails(promotionId);

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
const _removePromotionFromCart = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
const _validatePromotionForCart = async (
  req: HttpRequest<Record<string, string>, unknown, ValidatePromotionBody>,
  res: HttpResponse,
): Promise<void> => {
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
  const isValid = await managePromotionsUseCase.isValidForOrder(promotionId, Math.round(parseFloat(cartTotal) * 100), customerId);

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
export const activatePromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    const updatedPromotion = await changePromotionStatusUseCase.activate(id);

    res.status(200).json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion activated successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Pause a promotion
 */
export const pausePromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    const updatedPromotion = await changePromotionStatusUseCase.pause(id);

    res.status(200).json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion paused successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};
