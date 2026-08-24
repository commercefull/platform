/**
 * Basket Controller
 * HTTP interface for basket operations with content negotiation (JSON/HTML)
 */

import { query } from '../../../../libs/db';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
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
  ExtendExpirationUseCase,
  ApplyCouponCommand,
  ApplyCouponUseCase,
  RemoveCouponCommand,
  RemoveCouponUseCase,
} from '../../application/useCases';
import { CouponDiscountQuoteAdapter } from '../../infrastructure/acl/CouponDiscountQuoteAdapter';
import { CouponRepository } from '../../../coupon/infrastructure';

// ============================================================================
// Request Body Interfaces
// ============================================================================

interface GetOrCreateBasketBody {
  sessionId?: string;
  currency?: string;
}

interface AddItemBody {
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  itemType?: 'physical' | 'digital' | 'subscription' | 'service';
}

interface UpdateItemQuantityBody {
  quantity: number;
}

interface MergeBasketsBody {
  sourceBasketId: string;
  targetBasketId: string;
}

interface AssignToCustomerBody {
  customerId: string;
}

interface SetItemAsGiftBody {
  giftMessage?: string;
}

interface ExtendExpirationBody {
  days?: number;
}

interface ApplyCouponBody {
  couponCode: string;
}

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
      isGift: item.isGift,
    })),
    itemCount: basket.itemCount,
    subtotal: basket.subtotal.amount,
    createdAt: basket.createdAt.toISOString(),
    updatedAt: basket.updatedAt.toISOString(),
  };

}

// Admin override: apply a coupon without strict customer validations
export const applyCouponAdmin = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as ApplyCouponBody;
  const { couponCode } = body;

  if (!couponCode) {
    respondError(req, res, 'couponCode is required', 400);
    return;
  }

  const basket = await BasketRepo.findById(basketId);
  if (!basket) {
    respondError(req, res, 'Basket not found', 404);
    return;
  }

  const discountQuotePort = new CouponDiscountQuoteAdapter(CouponRepository);
  const validation = await discountQuotePort.validateDiscount(couponCode, basket.subtotal.amount, basket.customerId);
  if (!validation.valid || !validation.discount) {
    respondError(req, res, validation.error || 'Invalid coupon code', 400);
    return;
  }

  const discount = validation.discount;
  const discountType = discount.type === 'fixed_amount' ? 'fixed' : 'percentage';
  const discountValue = discount.value;
  basket.applyCoupon(couponCode, discountType, discountValue);
  await BasketRepo.save(basket);

  respond(req, res, basket.toJSON(), 200);
  
};

export const listBaskets = async (req: TypedRequest, res: Response): Promise<void> => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
  const rows = await query<Record<string, unknown>[]>(
    `SELECT "basketId", status, currency, "customerId", "sessionId", "createdAt", "updatedAt" FROM basket
     ORDER BY "updatedAt" DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  respond(req, res, { items: rows || [], count: (rows || []).length }, 200);
  
};

function mapBasketToSummary(basket: Basket): { basketId: string; itemCount: number; subtotal: number; currency: string } {
  return {
    basketId: basket.basketId,
    itemCount: basket.itemCount,
    subtotal: basket.subtotal.amount,
    currency: basket.currency,
  };
}

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: TypedRequest, res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Get or create basket
 * POST /baskets
 */
export const getOrCreateBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id;
  const body = req.body as GetOrCreateBasketBody;
  const sessionId = req.sessionID || body.sessionId;
  const currency = body.currency || 'USD';

  if (!customerId && !sessionId) {
    respondError(req, res, 'Either customer ID or session ID is required', 400);
    return;
  }

  const command = new GetOrCreateBasketCommand(customerId, sessionId, currency);
  const useCase = new GetOrCreateBasketUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
  
};

/**
 * Get basket by ID
 * GET /baskets/:basketId
 */
export const getBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;

  const basket = await BasketRepo.findById(basketId);

  if (!basket) {
    respondError(req, res, 'Basket not found', 404);
    return;
  }

  respond(req, res, mapBasketToResponse(basket), 200);
  
};

/**
 * Get basket summary (lightweight)
 * GET /baskets/:basketId/summary
 */
export const getBasketSummary = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;

  const basket = await BasketRepo.findById(basketId);

  if (!basket) {
    respondError(req, res, 'Basket not found', 404);
    return;
  }

  respond(req, res, mapBasketToSummary(basket), 200);
  
};

/**
 * Add item to basket
 * POST /baskets/:basketId/items
 */
export const addItem = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as AddItemBody;
  const { productId, productVariantId, sku, name, quantity, unitPrice, imageUrl, attributes, itemType } = body;

  // Validation
  if (!productId || !sku || !name || !quantity || unitPrice === undefined) {
    respondError(req, res, 'Missing required fields: productId, sku, name, quantity, unitPrice', 400);
    return;
  }

  if (quantity < 1) {
    respondError(req, res, 'Quantity must be at least 1', 400);
    return;
  }

  if (quantity > 100) {
    respondError(req, res, 'Quantity cannot exceed 100', 400);
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
    itemType || 'physical',
  );

  const useCase = new AddItemUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 201);
  
};

/**
 * Update item quantity
 * PATCH /baskets/:basketId/items/:basketItemId
 */
export const updateItemQuantity = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId, basketItemId } = req.params;
  const body = req.body as UpdateItemQuantityBody;
  const { quantity } = body;

  if (quantity === undefined) {
    respondError(req, res, 'Quantity is required', 400);
    return;
  }

  const command = new UpdateItemQuantityCommand(basketId, basketItemId, quantity);
  const useCase = new UpdateItemQuantityUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
  
};

/**
 * Remove item from basket
 * DELETE /baskets/:basketId/items/:basketItemId
 */
export const removeItem = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId, basketItemId } = req.params;

  const command = new RemoveItemCommand(basketId, basketItemId);
  const useCase = new RemoveItemUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Clear all items from basket
 * DELETE /baskets/:basketId/items
 */
export const clearBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;

  const command = new ClearBasketCommand(basketId);
  const useCase = new ClearBasketUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Get current user's basket
 * GET /baskets/me
 */
export const getMyBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id;
  const sessionId = req.sessionID;

  if (!customerId && !sessionId) {
    respondError(req, res, 'Authentication or session required', 401);
    return;
  }

  const command = new GetOrCreateBasketCommand(customerId, sessionId);
  const useCase = new GetOrCreateBasketUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
  
};

/**
 * Merge baskets (typically when guest logs in)
 * POST /baskets/merge
 */
export const mergeBaskets = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as MergeBasketsBody;
  const { sourceBasketId, targetBasketId } = body;

  if (!sourceBasketId || !targetBasketId) {
    respondError(req, res, 'Both sourceBasketId and targetBasketId are required', 400);
    return;
  }

  const command = new MergeBasketsCommand(sourceBasketId, targetBasketId);
  const useCase = new MergeBasketsUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Assign basket to customer
 * POST /baskets/:basketId/assign
 */
export const assignToCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as AssignToCustomerBody;
  const { customerId } = body;

  if (!customerId) {
    respondError(req, res, 'customerId is required', 400);
    return;
  }

  const command = new AssignBasketToCustomerCommand(basketId, customerId);
  const useCase = new AssignBasketToCustomerUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Set item as gift
 * POST /baskets/:basketId/items/:basketItemId/gift
 */
export const setItemAsGift = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId, basketItemId } = req.params;
  const body = req.body as SetItemAsGiftBody;
  const { giftMessage } = body;

  const command = new SetItemAsGiftCommand(basketId, basketItemId, giftMessage);
  const useCase = new SetItemAsGiftUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Extend basket expiration
 * PUT /baskets/:basketId/expiration
 */
export const extendExpiration = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as ExtendExpirationBody;
  const { days } = body;

  const command = new ExtendExpirationCommand(basketId, days || 7);
  const useCase = new ExtendExpirationUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Delete basket
 * DELETE /baskets/:basketId
 */
export const deleteBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;

  const basket = await BasketRepo.findById(basketId);
  if (!basket) {
    respondError(req, res, 'Basket not found', 404);
    return;
  }

  await BasketRepo.delete(basketId);

  respond(req, res, { message: 'Basket deleted successfully' }, 200);
  
};

// ============================================================================
// Coupon Actions
// ============================================================================

export const applyCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as ApplyCouponBody;
  const { couponCode } = body;

  if (!couponCode) {
    respondError(req, res, 'couponCode is required', 400);
    return;
  }

  const command = new ApplyCouponCommand(basketId, couponCode);
  const useCase = new ApplyCouponUseCase(BasketRepo, new CouponDiscountQuoteAdapter(CouponRepository));
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
};

export const removeCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketId } = req.params;

  const command = new RemoveCouponCommand(basketId);
  const useCase = new RemoveCouponUseCase(BasketRepo);
  const basket = await useCase.execute(command);

  respond(req, res, basket, 200);
  
};
