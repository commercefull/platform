import { jsonResponse } from 'libs/apiResponse';
/**
 * Order Customer Controller
 * HTTP interface for customer-facing order operations with content negotiation
 */

import type { HttpRequest, HttpResponse } from 'libs/http';

import { CreateOrderCommand, OrderItemInput, AddressInput } from '../../application/useCases/CreateOrder';
import { GetOrderCommand } from '../../application/useCases/GetOrder';
import { GetCustomerOrdersCommand } from '../../application/useCases/GetCustomerOrders';
import { CancelOrderCommand } from '../../application/useCases/CancelOrder';
import { getCustomerOrdersUseCase, getOrderUseCase, createOrderUseCase, cancelOrderUseCase } from '../../application/useCases/wired';
import { manageSalesChannelsUseCase } from '../../../store/application/useCases/wired';
import { isUuid } from '../../../../libs/uuid';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  jsonResponse(res, statusCode, { success: true, data });
}

function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  jsonResponse(res, statusCode, { success: false, error: message });
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Get customer's orders
 * GET /orders
 */
export const getMyOrders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id || req.user?.id;

  if (!customerId) {
    respondError(req, res, 'Authentication required', 401);
    return;
  }

  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const command = new GetCustomerOrdersCommand(customerId, limit, offset);
  const useCase = getCustomerOrdersUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
};

/**
 * Get order by ID
 * GET /orders/:orderId
 */
export const getOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const customerId = req.user?.customerId || req.user?.id || req.user?._id || req.user?.id;

  if (!isUuid(orderId)) {
    throw new OrderNotFoundError();
  }

  const command = new GetOrderCommand(orderId, undefined, customerId);
  const useCase = getOrderUseCase;
  const order = await useCase.execute(command);

  if (!order) {
    throw new OrderNotFoundError();
  }

  respond(req, res, order, 200);
};

/**
 * Get order by order number
 * GET /orders/number/:orderNumber
 */
export const getOrderByNumber = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderNumber } = req.params;
  const customerId = req.user?.customerId || req.user?.id || req.user?._id || req.user?.id;

  const command = new GetOrderCommand(undefined, orderNumber, customerId);
  const useCase = getOrderUseCase;
  const order = await useCase.execute(command);

  if (!order) {
    respondError(req, res, 'Order not found', 404);
    return;
  }

  respond(req, res, order, 200);
};

/**
 * Create a new order
 * POST /orders
 */
interface CreateOrderRequestBody {
  items: unknown[];
  shippingAddress: unknown;
  billingAddress?: unknown;
  basketId?: string;
  storeId?: string;
  channelId?: string;
  createdByUserId?: string;
  orderSource?: string;
  currencyCode?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  customerNotes?: string;
  shippingTotalCents?: number;
  hasGiftWrapping?: boolean;
  giftMessage?: string;
  isGift?: boolean;
}

/** Returns the first validation error message, or null when the body is acceptable. */
function validateCreateOrderBody(body: CreateOrderRequestBody): string | null {
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return 'Order must contain at least one item';
  }
  if (!body.shippingAddress) {
    return 'Shipping address is required';
  }
  if (!body.customerEmail) {
    return 'Customer email is required';
  }
  return null;
}

interface ResolvedOrderScope {
  customerId?: string;
  storeId?: string;
  channelId?: string;
  orderSource: string;
}

function buildCreateOrderCommand(req: HttpRequest, body: CreateOrderRequestBody, scope: ResolvedOrderScope): CreateOrderCommand {
  return new CreateOrderCommand({
    customerId: scope.customerId,
    customerEmail: body.customerEmail,
    items: body.items as OrderItemInput[],
    shippingAddress: body.shippingAddress as AddressInput,
    billingAddress: body.billingAddress as AddressInput,
    basketId: body.basketId,
    storeId: scope.storeId,
    channelId: scope.channelId,
    createdByUserId: body.createdByUserId || req.user?.userId || req.user?.id,
    orderSource: scope.orderSource,
    currencyCode: body.currencyCode,
    customerPhone: body.customerPhone,
    customerName: body.customerName,
    customerNotes: body.customerNotes,
    shippingTotalCents: body.shippingTotalCents,
    hasGiftWrapping: body.hasGiftWrapping,
    giftMessage: body.giftMessage,
    isGift: body.isGift,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });
}

export const createOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id || req.user?.id;
  const body = req.body as CreateOrderRequestBody;
  const _channelCodeHeader = req.get('x-channel-code');

  const bodyError = validateCreateOrderBody(body);
  if (bodyError) {
    respondError(req, res, bodyError, 400);
    return;
  }

  const resolvedStoreId = body.storeId || req.user?.storeId;
  const resolvedChannelId = body.channelId;
  const resolvedOrderSource = body.orderSource || 'web';

  // A customer may attribute an order to a store/channel, but only to one
  // that exists, is active, and — when both are given — is assigned.
  if (resolvedStoreId || resolvedChannelId) {
    await manageSalesChannelsUseCase.assertStoreChannelAccess({
      storeId: resolvedStoreId,
      channelId: resolvedChannelId,
    });
  }

  const command = buildCreateOrderCommand(req, body, {
    customerId,
    storeId: resolvedStoreId,
    channelId: resolvedChannelId,
    orderSource: resolvedOrderSource,
  });

  const useCase = createOrderUseCase;
  const order = await useCase.execute(command);

  respond(req, res, order, 201);
};

/**
 * Cancel an order
 * POST /orders/:orderId/cancel
 */
export const cancelOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { reason?: string };
  const { reason } = body;
  const customerId = req.user?.customerId || req.user?.id || req.user?._id || req.user?.id;

  if (!customerId) {
    respondError(req, res, 'Authentication required', 401);
    return;
  }

  const cancelReason = reason || 'Cancelled by customer';

  const command = new CancelOrderCommand(orderId, cancelReason, customerId);
  const useCase = cancelOrderUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
};
