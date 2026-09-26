/**
 * Basket Controller
 * HTTP interface for basket operations with content negotiation (JSON/HTML)
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { Basket } from '../../domain/entities/Basket';
import {
  BasketResponse,
  GetOrCreateBasketCommand,
  AddItemCommand,
  UpdateItemQuantityCommand,
  RemoveItemCommand,
  ClearBasketCommand,
  MergeBasketsCommand,
  AssignBasketToCustomerCommand,
  SetItemAsGiftCommand,
  ExtendExpirationCommand,
  ApplyCouponCommand,
  RemoveCouponCommand,
} from '../../application/useCases';
import {
  applyCouponAdminOverrideUseCase,
  manageAdminBasketUseCase,
  productDetailsPort,
  getOrCreateBasketUseCase,
  addItemUseCase,
  updateItemQuantityUseCase,
  removeItemUseCase,
  clearBasketUseCase,
  mergeBasketsUseCase,
  assignBasketToCustomerUseCase,
  setItemAsGiftUseCase,
  extendExpirationUseCase,
  applyCouponUseCase,
  removeCouponUseCase,
} from '../../application/useCases/wired';

// ============================================================================
// Request Body Interfaces
// ============================================================================

interface GetOrCreateBasketBody {
  sessionId?: string;
  currency?: string;
  storeId?: string;
}

interface AddItemBody {
  productId: string;
  productVariantId?: string;
  sku?: string;
  name?: string;
  quantity: number;
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
      unitPriceCents: item.unitPrice.cents,
      lineTotalCents: item.lineTotal.cents,
      imageUrl: item.imageUrl,
      isGift: item.isGift,
    })),
    itemCount: basket.itemCount,
    subtotalCents: basket.subtotal.cents,
    createdAt: basket.createdAt.toISOString(),
    updatedAt: basket.updatedAt.toISOString(),
  };
}

// Admin override: apply a coupon without strict customer validations
export const applyCouponAdmin = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as ApplyCouponBody;
  const { couponCode } = body;

  if (!couponCode) {
    respondError(req, res, 'couponCode is required', 400);
    return;
  }

  const basket = await applyCouponAdminOverrideUseCase.execute(basketId, couponCode);
  respond(req, res, basket.toJSON(), 200);
};

export const listBaskets = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
  const rows = await manageAdminBasketUseCase.findSummaries(limit, offset);
  respond(req, res, { items: rows || [], count: (rows || []).length }, 200);
};

function mapBasketToSummary(basket: Basket): { basketId: string; itemCount: number; subtotalCents: number; currency: string } {
  return {
    basketId: basket.basketId,
    itemCount: basket.itemCount,
    subtotalCents: basket.subtotal.cents,
    currency: basket.currency,
  };
}

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Get or create basket
 * POST /baskets
 */
export const getOrCreateBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id;
  const body = req.body as GetOrCreateBasketBody;
  const sessionId = req.sessionID || body.sessionId;
  // Store context may be attached by storefront middleware; when present the
  // currency is validated against the store's supported currencies.
  const storeId = (res.locals.storeId as string) || body.storeId;

  if (!customerId && !sessionId) {
    respondError(req, res, 'Either customer ID or session ID is required', 400);
    return;
  }

  const command = new GetOrCreateBasketCommand(customerId, sessionId, body.currency, storeId);
  const basket = await getOrCreateBasketUseCase.execute(command);

  // Return 201 if the basket was newly created, 200 if it already existed
  const isNew = (basket as { isNew?: boolean }).isNew === true;
  respond(req, res, basket, isNew ? 201 : 200);
};

/**
 * Get basket by ID
 * GET /baskets/:basketId
 */
export const getBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;

  const basket = await manageAdminBasketUseCase.findById(basketId);

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
export const getBasketSummary = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;

  const basket = await manageAdminBasketUseCase.findById(basketId);

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
export const addItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as AddItemBody;
  let { productId, productVariantId, sku, name, quantity, imageUrl, attributes, itemType } = body;

  // Validation — price is never client-supplied; the use case resolves it via pricing
  if (!productId || !quantity) {
    respondError(req, res, 'Missing required fields: productId, quantity', 400);
    return;
  }

  // Look up product details if sku or name not provided
  if ((!sku || !name) && productId) {
    const product = await productDetailsPort.findProductDetails(productId);
    if (product) {
      sku = sku || product.sku;
      name = name || product.name;
    }
  }

  if (!sku || !name) {
    respondError(req, res, 'Missing required fields: sku, name (and product not found)', 400);
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
    productVariantId,
    imageUrl,
    attributes,
    itemType || 'physical',
  );

  const basket = await addItemUseCase.execute(command);

  respond(req, res, basket, 201);
};

/**
 * Update item quantity
 * PATCH /baskets/:basketId/items/:basketItemId
 */
export const updateItemQuantity = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId, basketItemId } = req.params;
  const body = req.body as UpdateItemQuantityBody;
  const { quantity } = body;

  if (quantity === undefined) {
    respondError(req, res, 'Quantity is required', 400);
    return;
  }

  const command = new UpdateItemQuantityCommand(basketId, basketItemId, quantity);
  const basket = await updateItemQuantityUseCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Remove item from basket
 * DELETE /baskets/:basketId/items/:basketItemId
 */
export const removeItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId, basketItemId } = req.params;

  const command = new RemoveItemCommand(basketId, basketItemId);
  const basket = await removeItemUseCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Clear all items from basket
 * DELETE /baskets/:basketId/items
 */
export const clearBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;

  const command = new ClearBasketCommand(basketId);
  const basket = await clearBasketUseCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Get current user's basket
 * GET /baskets/me
 */
export const getMyBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id;
  const sessionId = req.sessionID;

  if (!customerId && !sessionId) {
    respondError(req, res, 'Authentication or session required', 401);
    return;
  }

  const command = new GetOrCreateBasketCommand(customerId, sessionId);
  const basket = await getOrCreateBasketUseCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Merge baskets (typically when guest logs in)
 * POST /baskets/merge
 */
export const mergeBaskets = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as MergeBasketsBody;
  const { sourceBasketId, targetBasketId } = body;

  if (!sourceBasketId || !targetBasketId) {
    respondError(req, res, 'Both sourceBasketId and targetBasketId are required', 400);
    return;
  }

  // Get or create the target basket if it doesn't exist
  const { isNew } = await manageAdminBasketUseCase.getOrCreateForMerge(targetBasketId);

  const command = new MergeBasketsCommand(sourceBasketId, targetBasketId);
  const basket = await mergeBasketsUseCase.execute(command);

  respond(req, res, basket, isNew ? 201 : 200);
};

/**
 * Assign basket to customer
 * POST /baskets/:basketId/assign
 */
export const assignToCustomer = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as AssignToCustomerBody;
  const { customerId } = body;

  if (!customerId) {
    respondError(req, res, 'customerId is required', 400);
    return;
  }

  const command = new AssignBasketToCustomerCommand(basketId, customerId);
  const basket = await assignBasketToCustomerUseCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Set item as gift
 * POST /baskets/:basketId/items/:basketItemId/gift
 */
export const setItemAsGift = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId, basketItemId } = req.params;
  const body = req.body as SetItemAsGiftBody;
  const { giftMessage } = body;

  const command = new SetItemAsGiftCommand(basketId, basketItemId, giftMessage);
  const basket = await setItemAsGiftUseCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Extend basket expiration
 * PUT /baskets/:basketId/expiration
 */
export const extendExpiration = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as ExtendExpirationBody;
  const { days } = body;

  const command = new ExtendExpirationCommand(basketId, days || 7);
  const basket = await extendExpirationUseCase.execute(command);

  respond(req, res, basket, 200);
};

/**
 * Delete basket
 * DELETE /baskets/:basketId
 */
export const deleteBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;

  const basket = await manageAdminBasketUseCase.findById(basketId);
  if (!basket) {
    respondError(req, res, 'Basket not found', 404);
    return;
  }

  await manageAdminBasketUseCase.delete(basketId);

  respond(req, res, { message: 'Basket deleted successfully' }, 200);
};

// ============================================================================
// Coupon Actions
// ============================================================================

export const applyCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as ApplyCouponBody;
  const { couponCode } = body;

  if (!couponCode) {
    respondError(req, res, 'couponCode is required', 400);
    return;
  }

  const command = new ApplyCouponCommand(basketId, couponCode);
  const basket = await applyCouponUseCase.execute(command);

  respond(req, res, basket, 200);
};

export const removeCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;

  const command = new RemoveCouponCommand(basketId);
  const basket = await removeCouponUseCase.execute(command);

  respond(req, res, basket, 200);
};
