/**
 * Order Business Controller
 * HTTP interface for business/admin order operations with content negotiation
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { GetOrderCommand } from '../../application/useCases/GetOrder';
import { ListOrdersCommand } from '../../application/useCases/ListOrders';
import { CreateOrderCommand, OrderItemInput, AddressInput } from '../../application/useCases/CreateOrder';
import { UpdateOrderStatusCommand } from '../../application/useCases/UpdateOrderStatus';
import { CancelOrderCommand } from '../../application/useCases/CancelOrder';
import { ProcessRefundCommand } from '../../application/useCases/ProcessRefund';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import { OrderFilters } from '../../domain/repositories/OrderRepository';
import { GetOrderExplainabilityCommand } from '../../application/useCases/GetOrderExplainability';
import {
  listOrdersUseCase,
  getOrderUseCase,
  createOrderUseCase,
  updateOrderStatusUseCase,
  cancelOrderUseCase,
  processRefundUseCase,
  getOrderHistoryUseCase,
  getOrderExplainabilityUseCase,
  getStoreSalesSummaryUseCase,
} from '../../application/useCases/wired';
import { isUuid } from '../../../../libs/uuid';
import { OrderNotFoundError, RefundAmountMustBePositiveError } from '../../domain/errors/OrderErrors';
import { respond, respondError, storeChannelError } from './orderControllerRespond';

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * List all orders with filters
 * GET /orders
 */
export const listOrders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId, channelId, limit, offset, orderBy, orderDirection } = req.query;

  const scopeError = await storeChannelError(req, storeId as string | undefined, channelId as string | undefined);
  if (scopeError) {
    respondError(req, res, scopeError, 400);
    return;
  }

  const command = new ListOrdersCommand(
    buildOrderFilters(req.query),
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0,
    (orderBy as string) || 'createdAt',
    (orderDirection as 'asc' | 'desc') || 'desc',
  );

  const useCase = listOrdersUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
};

/** Build OrderFilters from raw query params; undefined when empty. */
function buildOrderFilters(query: HttpRequest['query']): OrderFilters | undefined {
  const filters: OrderFilters = {};
  if (query.customerId) filters.customerId = query.customerId as string;
  if (query.storeId) filters.storeId = query.storeId as string;
  if (query.channelId) filters.channelId = query.channelId as string;
  if (query.createdByUserId) filters.createdByUserId = query.createdByUserId as string;
  if (query.orderSource) filters.orderSource = query.orderSource as string;
  if (query.status) filters.status = query.status as OrderStatus;
  if (query.paymentStatus) filters.paymentStatus = query.paymentStatus as PaymentStatus;
  if (query.fulfillmentStatus) filters.fulfillmentStatus = query.fulfillmentStatus as FulfillmentStatus;
  if (query.startDate) filters.startDate = new Date(query.startDate as string);
  if (query.endDate) filters.endDate = new Date(query.endDate as string);
  if (query.minAmount) filters.minAmountCents = Math.round(parseFloat(query.minAmount as string) * 100);
  if (query.maxAmount) filters.maxAmountCents = Math.round(parseFloat(query.maxAmount as string) * 100);
  if (query.search) filters.search = query.search as string;
  return Object.keys(filters).length > 0 ? filters : undefined;
}

/**
 * Create an order on behalf of the organization (POS / back-office / manual orders).
 * POST /business/orders
 *
 * Unlike the customer-facing endpoint, customerEmail and shippingAddress are
 * optional — walk-in POS sales often have neither.
 */
export const createOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as {
    items: OrderItemInput[];
    customerId?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerName?: string;
    customerNotes?: string;
    shippingAddress?: AddressInput;
    billingAddress?: AddressInput;
    basketId?: string;
    storeId?: string;
    channelId?: string;
    orderSource?: string;
    currencyCode?: string;
    shippingTotalCents?: number;
    hasGiftWrapping?: boolean;
    giftMessage?: string;
    isGift?: boolean;
    metadata?: Record<string, unknown>;
  };

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    respondError(req, res, 'Order must contain at least one item', 400);
    return;
  }

  const scopeError = await storeChannelError(req, body.storeId, body.channelId);
  if (scopeError) {
    respondError(req, res, scopeError, 400);
    return;
  }

  const command = new CreateOrderCommand({
    customerId: body.customerId,
    customerEmail: body.customerEmail,
    items: body.items,
    shippingAddress: body.shippingAddress,
    billingAddress: body.billingAddress,
    basketId: body.basketId,
    storeId: body.storeId,
    channelId: body.channelId,
    createdByUserId: req.user?.userId,
    orderSource: body.orderSource || 'manual',
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
    metadata: body.metadata,
    allowGuestOrder: true,
  });

  const order = await createOrderUseCase.execute(command);

  respond(req, res, order, 201);
};

/**
 * Get order details
 * GET /orders/:orderId
 */
export const getOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;

  if (!isUuid(orderId)) {
    throw new OrderNotFoundError();
  }

  const command = new GetOrderCommand(orderId);
  const useCase = getOrderUseCase;
  const order = await useCase.execute(command);

  if (!order) {
    throw new OrderNotFoundError();
  }

  respond(req, res, order, 200);
};

/**
 * Get order explainability — market context, version snapshot, decision log,
 * FX snapshot, and discount/tax provenance.
 * GET /orders/:orderId/decisions
 */
export const getOrderDecisions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;

  if (!isUuid(orderId)) {
    throw new OrderNotFoundError();
  }

  const command = new GetOrderExplainabilityCommand(orderId);
  const result = await getOrderExplainabilityUseCase.execute(command);

  respond(req, res, result, 200);
};

/**
 * Update order status
 * PUT /orders/:orderId/status
 */
export const updateOrderStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { status: string; reason?: string };
  const { status, reason } = body;

  // Validate status
  const validStatuses = Object.values(OrderStatus) as string[];
  if (!validStatuses.includes(status)) {
    respondError(req, res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    return;
  }

  const command = new UpdateOrderStatusCommand(orderId, status as OrderStatus, reason);
  const useCase = updateOrderStatusUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
};

/**
 * Cancel an order (admin)
 * POST /orders/:orderId/cancel
 */
export const cancelOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { reason?: string };
  const { reason } = body;

  if (!reason) {
    respondError(req, res, 'Cancellation reason is required', 400);
    return;
  }

  const command = new CancelOrderCommand(orderId, reason);
  const useCase = cancelOrderUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
};

/**
 * Process refund
 * POST /orders/:orderId/refund
 */
export const processRefund = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { amount: number; reason: string; transactionId?: string };
  const { amount, reason, transactionId } = body;

  if (!amount || amount <= 0) {
    throw new RefundAmountMustBePositiveError();
  }

  if (!reason) {
    respondError(req, res, 'Refund reason is required', 400);
    return;
  }

  const command = new ProcessRefundCommand(orderId, amount, reason, transactionId);
  const useCase = processRefundUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
};

/**
 * Get order statistics
 * GET /orders/stats
 */
export const getOrderStats = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { startDate, endDate, customerId, storeId, channelId, createdByUserId, orderSource } = req.query;

  const scopeError = await storeChannelError(req, storeId as string | undefined, channelId as string | undefined);
  if (scopeError) {
    respondError(req, res, scopeError, 400);
    return;
  }

  const filters: OrderFilters = {};
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);
  if (customerId) filters.customerId = customerId as string;
  if (storeId) filters.storeId = storeId as string;
  if (channelId) filters.channelId = channelId as string;
  if (createdByUserId) filters.createdByUserId = createdByUserId as string;
  if (orderSource) filters.orderSource = orderSource as string;

  const stats = await getOrderHistoryUseCase.getStats(Object.keys(filters).length > 0 ? filters : undefined);

  respond(req, res, stats, 200);
};

export const getStoreSalesSummary = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const scopeError = await storeChannelError(req, req.query.storeId as string | undefined, undefined);
  if (scopeError) {
    respondError(req, res, scopeError, 400);
    return;
  }

  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().setDate(new Date().getDate() - 30));
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

  const summary = await getStoreSalesSummaryUseCase.execute({
    storeId: req.query.storeId as string | undefined,
    dateFrom,
    dateTo,
  });

  respond(req, res, summary, 200);
};

/**
 * Get order status history
 * GET /orders/:orderId/history
 */
export const getOrderHistory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;

  const history = await getOrderHistoryUseCase.getStatusHistory(orderId);

  respond(req, res, { orderId, history }, 200);
};

// Re-exported from orderBusinessOpsControllers so existing router imports stay valid.
export {
  addOrderNote,
  createFulfillmentPackage,
  createOrderItem,
  createOrderRefund,
  deleteOrderItem,
  deleteOrderNote,
  getFulfillmentHistory,
  getOrderByNumber,
  getOrderItemById,
  getOrderItems,
  getPaymentHistory,
  getStatusHistory,
  listFulfillmentPackages,
  listOrderNotes,
  listOrderRefunds,
  trackFulfillmentPackage,
  updateFulfillmentStatus,
  updateOrderItem,
  updatePaymentStatus,
} from './orderBusinessOpsControllers';
