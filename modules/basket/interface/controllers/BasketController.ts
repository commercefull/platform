/**
 * Basket Controller
 * HTTP interface for basket operations with content negotiation (JSON/HTML)
 */

import { Request, Response } from 'express';
import BasketRepo from '../../infrastructure/repositories/BasketRepository';
import { Basket } from '../../domain/entities/Basket';
import {
  BasketResponse,
  GetOrCreateBasketCommand,
  GetOrCreateBasketUseCase,
  AddItemCommand,
  AddItemUseCase,
  UpdateItemQuantityCommand,
  UpdateItemQuantityUseCase,
  RemoveItemCommand,
  RemoveItemUseCase,
  ClearBasketCommand,
  ClearBasketUseCase,
  MergeBasketsCommand,
  MergeBasketsUseCase,
  AssignBasketToCustomerCommand,
  AssignBasketToCustomerUseCase,
  SetItemAsGiftCommand,
  SetItemAsGiftUseCase,
  ExtendExpirationCommand,
  ExtendExpirationUseCase
} from '../../application/useCases';
import { BasketNotFoundError, BasketItemNotFoundError, InvalidExpirationDaysError, BasketNotActiveError, BasketExpiredError } from '../../domain/errors/BasketErrors';

// ============================================================================
// Response Mappers
// ============================================================================

function mapBasketToResponse(basket: Basket): BasketResponse {
  return {
    basketId: basket.basketId,
    customerId: basket.customerId,
    sessionId: basket.sessionId,
    status: basket.status,
    currency: basket.currency,
    items: basket.items.map(item => ({
      basketItemId: item.basketItemId,
      productId: item.productId,
      productVariantId: item.productVariantId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.amount,
      lineTotal: item.lineTotal.amount,
      imageUrl: item.imageUrl,
      isGift: item.isGift
    })),
    itemCount: basket.itemCount,
    subtotal: basket.subtotal.amount,
    createdAt: basket.createdAt.toISOString(),
    updatedAt: basket.updatedAt.toISOString()
  };
}

function mapBasketToSummary(basket: Basket): { basketId: string; itemCount: number; subtotal: number; currency: string } {
  return {
    basketId: basket.basketId,
    itemCount: basket.itemCount,
    subtotal: basket.subtotal.amount,
    currency: basket.currency
  };
}

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

type ResponseData = Record<string, any>;

/**
 * Respond with JSON or HTML based on Accept header
 */
function respond(
  req: Request,
  res: Response,
  data: ResponseData,
  statusCode: number = 200,
  htmlTemplate?: string
): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    // Render HTML response
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    // Default to JSON response
    res.status(statusCode).json({ success: true, data });
  }
}

/**
 * Respond with error in JSON or HTML based on Accept header
 */
function respondError(
  req: Request,
  res: Response,
  message: string,
  statusCode: number = 500,
  htmlTemplate?: string
): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { error: message, success: false });
  } else {
    res.status(statusCode).json({ success: false, error: message });
  }
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Get or create basket
 * POST /baskets
 */
export const getOrCreateBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId;
    const sessionId = req.sessionID || req.body.sessionId;
    const currency = req.body.currency || 'USD';

    if (!customerId && !sessionId) {
      respondError(req, res, 'Either customer ID or session ID is required', 400, 'basket/error');
      return;
    }

    const command = new GetOrCreateBasketCommand(customerId, sessionId, currency);
    const useCase = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error getting/creating basket:', error);
    respondError(req, res, error.message || 'Failed to get or create basket', 500, 'basket/error');
  }
};

/**
 * Get basket by ID
 * GET /baskets/:basketId
 */
export const getBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    const basket = await BasketRepo.findById(basketId);

    if (!basket) {
      respondError(req, res, 'Basket not found', 404, 'basket/error');
      return;
    }

    respond(req, res, mapBasketToResponse(basket), 200, 'basket/view');
  } catch (error: any) {
    console.error('Error getting basket:', error);
    respondError(req, res, error.message || 'Failed to get basket', 500, 'basket/error');
  }
};

/**
 * Get basket summary (lightweight)
 * GET /baskets/:basketId/summary
 */
export const getBasketSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    const basket = await BasketRepo.findById(basketId);

    if (!basket) {
      respondError(req, res, 'Basket not found', 404, 'basket/error');
      return;
    }

    respond(req, res, mapBasketToSummary(basket), 200, 'basket/summary');
  } catch (error: any) {
    console.error('Error getting basket summary:', error);
    respondError(req, res, error.message || 'Failed to get basket summary', 500, 'basket/error');
  }
};

/**
 * Add item to basket
 * POST /baskets/:basketId/items
 */
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;
    const { productId, productVariantId, sku, name, quantity, unitPrice, imageUrl, attributes, itemType } = req.body;

    // Validation
    if (!productId || !sku || !name || !quantity || unitPrice === undefined) {
      respondError(req, res, 'Missing required fields: productId, sku, name, quantity, unitPrice', 400, 'basket/error');
      return;
    }

    if (quantity < 1) {
      respondError(req, res, 'Quantity must be at least 1', 400, 'basket/error');
      return;
    }

    const command = new AddItemCommand(
      basketId,
      productId,
      sku,
      name,
      quantity,
      unitPrice,
      productVariantId,
      imageUrl,
      attributes,
      itemType || 'physical'
    );

    const useCase = new AddItemUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 201, 'basket/view');
  } catch (error: any) {
    console.error('Error adding item to basket:', error);
    respondError(req, res, error.message || 'Failed to add item to basket', 500, 'basket/error');
  }
};

/**
 * Update item quantity
 * PATCH /baskets/:basketId/items/:basketItemId
 */
export const updateItemQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId, basketItemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      respondError(req, res, 'Quantity is required', 400, 'basket/error');
      return;
    }

    const command = new UpdateItemQuantityCommand(basketId, basketItemId, quantity);
    const useCase = new UpdateItemQuantityUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error updating item quantity:', error);
    respondError(req, res, error.message || 'Failed to update item quantity', 500, 'basket/error');
  }
};

/**
 * Remove item from basket
 * DELETE /baskets/:basketId/items/:basketItemId
 */
export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId, basketItemId } = req.params;

    const command = new RemoveItemCommand(basketId, basketItemId);
    const useCase = new RemoveItemUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error removing item from basket:', error);
    if (error instanceof BasketNotFoundError || error instanceof BasketItemNotFoundError) {
      respondError(req, res, error.message, error.statusCode, 'basket/error');
      return;
    }
    respondError(req, res, error.message || 'Failed to remove item from basket', 500, 'basket/error');
  }
};

/**
 * Clear all items from basket
 * DELETE /baskets/:basketId/items
 */
export const clearBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    const command = new ClearBasketCommand(basketId);
    const useCase = new ClearBasketUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error clearing basket:', error);
    if (error.message === 'Basket not found') {
      respondError(req, res, 'Basket not found', 404, 'basket/error');
      return;
    }
    respondError(req, res, error.message || 'Failed to clear basket', 500, 'basket/error');
  }
};

/**
 * Get current user's basket
 * GET /baskets/me
 */
export const getMyBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId;
    const sessionId = req.sessionID;

    if (!customerId && !sessionId) {
      respondError(req, res, 'Authentication or session required', 401, 'basket/error');
      return;
    }

    const command = new GetOrCreateBasketCommand(customerId, sessionId);
    const useCase = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error getting my basket:', error);
    respondError(req, res, error.message || 'Failed to get basket', 500, 'basket/error');
  }
};

/**
 * Merge baskets (typically when guest logs in)
 * POST /baskets/merge
 */
export const mergeBaskets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceBasketId, targetBasketId } = req.body;

    if (!sourceBasketId || !targetBasketId) {
      respondError(req, res, 'Both sourceBasketId and targetBasketId are required', 400, 'basket/error');
      return;
    }

    const command = new MergeBasketsCommand(sourceBasketId, targetBasketId);
    const useCase = new MergeBasketsUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error merging baskets:', error);
    if (error instanceof BasketNotFoundError || error instanceof BasketNotActiveError || error instanceof BasketExpiredError) {
      respondError(req, res, error.message, error.statusCode, 'basket/error');
      return;
    }
    respondError(req, res, error.message || 'Failed to merge baskets', 500, 'basket/error');
  }
};

/**
 * Assign basket to customer
 * POST /baskets/:basketId/assign
 */
export const assignToCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      respondError(req, res, 'customerId is required', 400, 'basket/error');
      return;
    }

    const command = new AssignBasketToCustomerCommand(basketId, customerId);
    const useCase = new AssignBasketToCustomerUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error assigning basket to customer:', error);
    if (error.message === 'Basket not found') {
      respondError(req, res, 'Basket not found', 404, 'basket/error');
      return;
    }
    respondError(req, res, error.message || 'Failed to assign basket to customer', 500, 'basket/error');
  }
};

/**
 * Set item as gift
 * POST /baskets/:basketId/items/:basketItemId/gift
 */
export const setItemAsGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId, basketItemId } = req.params;
    const { giftMessage } = req.body;

    const command = new SetItemAsGiftCommand(basketId, basketItemId, giftMessage);
    const useCase = new SetItemAsGiftUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error setting item as gift:', error);
    if (error.message === 'Basket not found' || error.message === 'Item not found in basket') {
      respondError(req, res, error.message, 404, 'basket/error');
      return;
    }
    respondError(req, res, error.message || 'Failed to set item as gift', 500, 'basket/error');
  }
};

/**
 * Extend basket expiration
 * PUT /baskets/:basketId/expiration
 */
export const extendExpiration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;
    const { days } = req.body;

    const command = new ExtendExpirationCommand(basketId, days || 7);
    const useCase = new ExtendExpirationUseCase(BasketRepo);
    const basket = await useCase.execute(command);

    respond(req, res, basket, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error extending basket expiration:', error);
    if (error instanceof BasketNotFoundError || error instanceof InvalidExpirationDaysError) {
      respondError(req, res, error.message, error.statusCode, 'basket/error');
      return;
    }
    respondError(req, res, error.message || 'Failed to extend basket expiration', 500, 'basket/error');
  }
};

/**
 * Delete basket
 * DELETE /baskets/:basketId
 */
export const deleteBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    const basket = await BasketRepo.findById(basketId);
    if (!basket) {
      respondError(req, res, 'Basket not found', 404, 'basket/error');
      return;
    }

    await BasketRepo.delete(basketId);

    respond(req, res, { message: 'Basket deleted successfully' }, 200, 'basket/view');
  } catch (error: any) {
    console.error('Error deleting basket:', error);
    respondError(req, res, error.message || 'Failed to delete basket', 500, 'basket/error');
  }
};
