/**
 * Order Business Controller
 * HTTP interface for business/admin order operations with content negotiation
 */

import type { HttpRequest, HttpResponse } from 'libs/http';

const OrderRepo = orderDataRepository.commands;
const orderQueryRepo = orderDataRepository.queries;
const orderFulfillmentRepo = orderFulfillmentDataRepository.fulfillments;
import { GetOrderCommand } from '../../application/useCases/GetOrder';
import { ListOrdersCommand } from '../../application/useCases/ListOrders';
import { GetStoreSalesSummaryUseCase } from '../../application/useCases/GetStoreSalesSummary';
import { UpdateOrderStatusCommand } from '../../application/useCases/UpdateOrderStatus';
import { CancelOrderCommand } from '../../application/useCases/CancelOrder';
import { ProcessRefundCommand } from '../../application/useCases/ProcessRefund';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import { OrderFilters } from '../../domain/repositories/OrderRepository';
import { AddOrderNoteCommand } from '../../application/useCases/AddOrderNote';
import { CreateOrderRefundCommand } from '../../application/useCases/CreateOrderRefund';
import { TrackFulfillmentPackageCommand } from '../../application/useCases/TrackFulfillmentPackage';
import {
  listOrdersUseCase,
  getOrderUseCase,
  updateOrderStatusUseCase,
  cancelOrderUseCase,
  processRefundUseCase,
  addOrderNoteUseCase,
  createOrderRefundUseCase,
  trackFulfillmentPackageUseCase,
} from '../../application/useCases/wired';
import { OrderItem } from '../../domain/entities/OrderItem';
import { Money } from '../../domain/valueObjects/Money';
import { generateUUID, isUuid } from '../../../../libs/uuid';
import { query, queryOne } from '../../../../libs/db';
import { orderDataRepository, orderFulfillmentDataRepository } from '../../application/wired';
import { OrderNotFoundError, RefundAmountMustBePositiveError } from '../../domain/errors/OrderErrors';

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
 * List all orders with filters
 * GET /orders
 */
export const listOrders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const {
    customerId,
    storeId,
    channelId,
    createdByUserId,
    orderSource,
    status,
    paymentStatus,
    fulfillmentStatus,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    search,
    limit,
    offset,
    orderBy,
    orderDirection,
  } = req.query;

  const filters: OrderFilters = {};
  if (customerId) filters.customerId = customerId as string;
  if (storeId) filters.storeId = storeId as string;
  if (channelId) filters.channelId = channelId as string;
  if (createdByUserId) filters.createdByUserId = createdByUserId as string;
  if (orderSource) filters.orderSource = orderSource as string;
  if (status) filters.status = status as OrderStatus;
  if (paymentStatus) filters.paymentStatus = paymentStatus as PaymentStatus;
  if (fulfillmentStatus) filters.fulfillmentStatus = fulfillmentStatus as FulfillmentStatus;
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);
  if (minAmount) filters.minAmount = parseFloat(minAmount as string);
  if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);
  if (search) filters.search = search as string;

  const command = new ListOrdersCommand(
    Object.keys(filters).length > 0 ? filters : undefined,
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0,
    (orderBy as string) || 'createdAt',
    (orderDirection as 'asc' | 'desc') || 'desc',
  );

  const useCase = listOrdersUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
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

  const filters: OrderFilters = {};
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);
  if (customerId) filters.customerId = customerId as string;
  if (storeId) filters.storeId = storeId as string;
  if (channelId) filters.channelId = channelId as string;
  if (createdByUserId) filters.createdByUserId = createdByUserId as string;
  if (orderSource) filters.orderSource = orderSource as string;

  const stats = await OrderRepo.getOrderStats(Object.keys(filters).length > 0 ? filters : undefined);

  respond(req, res, stats, 200);
};

export const getStoreSalesSummary = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().setDate(new Date().getDate() - 30));
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

  const useCase = new GetStoreSalesSummaryUseCase();
  const summary = await useCase.execute({
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

  const history = await OrderRepo.getStatusHistory(orderId);

  respond(req, res, { orderId, history }, 200);
};

// ============================================================================
// Order Notes
// ============================================================================

/**
 * List notes for an order
 * GET /business/orders/:orderId/notes
 */
export const listOrderNotes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const notes = await orderQueryRepo.findNotesByOrder(orderId);
  respond(req, res, { orderId, notes });
};

/**
 * Add a note to an order
 * POST /business/orders/:orderId/notes
 */
export const addOrderNote = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { content: string; isCustomerVisible?: boolean };
  const { content, isCustomerVisible } = body;

  const command = new AddOrderNoteCommand(orderId, content, isCustomerVisible ?? false, req.user?.userId);
  const useCase = addOrderNoteUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 201);
};

/**
 * Soft-delete a note from an order
 * DELETE /business/orders/:orderId/notes/:noteId
 */
export const deleteOrderNote = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { noteId } = req.params;
  const deleted = await orderQueryRepo.softDeleteNote(noteId);
  if (!deleted) {
    respondError(req, res, 'Order note not found', 404);
    return;
  }
  respond(req, res, { deleted: true });
};

// ============================================================================
// Order Refunds
// ============================================================================

/**
 * List refunds for an order
 * GET /business/orders/:orderId/refunds
 */
export const listOrderRefunds = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const refunds = await orderQueryRepo.findRefundsByOrder(orderId);
  respond(req, res, { orderId, refunds });
};

/**
 * Create a refund for an order payment
 * POST /business/orders/:orderId/refunds
 */
export const createOrderRefund = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as { orderPaymentId: string; amount: string; reason: string; notes?: string; transactionId?: string };
  const { orderPaymentId, amount, reason, notes, transactionId } = body;

  const command = new CreateOrderRefundCommand(orderPaymentId, parseFloat(amount), reason, notes, transactionId, req.user?.userId);
  const useCase = createOrderRefundUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 201);
};

// ============================================================================
// Fulfillment Packages
// ============================================================================

/**
 * List packages for a fulfillment
 * GET /business/orders/:orderId/packages
 */
export const listFulfillmentPackages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { fulfillmentId } = req.query;
  if (!fulfillmentId) {
    respondError(req, res, 'fulfillmentId query parameter is required', 400);
    return;
  }
  const packages = await orderFulfillmentRepo.findByFulfillment(fulfillmentId as string);
  respond(req, res, { fulfillmentId, packages });
};

/**
 * Create a fulfillment package
 * POST /business/orders/:orderId/packages
 */
export const createFulfillmentPackage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as {
    orderFulfillmentId: string;
    packageNumber: string;
    trackingNumber?: string;
    weight?: string;
    dimensions?: Record<string, unknown>;
    packageType?: string;
    shippingLabelUrl?: string;
    commercialInvoiceUrl?: string;
    customsInfo?: Record<string, unknown>;
  };
  const {
    orderFulfillmentId,
    packageNumber,
    trackingNumber,
    weight,
    dimensions,
    packageType,
    shippingLabelUrl,
    commercialInvoiceUrl,
    customsInfo,
  } = body;

  const command = new TrackFulfillmentPackageCommand(
    orderFulfillmentId,
    packageNumber,
    trackingNumber,
    shippingLabelUrl,
    commercialInvoiceUrl,
    weight ? parseFloat(weight) : undefined,
    dimensions,
    packageType,
    customsInfo,
  );
  const useCase = trackFulfillmentPackageUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 201);
};

/**
 * Update tracking on a fulfillment package
 * POST /business/orders/:orderId/packages/:packageId/tracking
 */
export const trackFulfillmentPackage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { packageId } = req.params;
  const body = req.body as {
    orderFulfillmentId?: string;
    packageNumber?: string;
    trackingNumber?: string;
    shippingLabelUrl?: string;
    commercialInvoiceUrl?: string;
  };
  const { orderFulfillmentId, packageNumber, trackingNumber, shippingLabelUrl, commercialInvoiceUrl } = body;

  const command = new TrackFulfillmentPackageCommand(
    orderFulfillmentId || '',
    packageNumber || '',
    trackingNumber,
    shippingLabelUrl,
    commercialInvoiceUrl,
    undefined,
    undefined,
    undefined,
    undefined,
    packageId,
  );
  const useCase = trackFulfillmentPackageUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result);
};

// ============================================================================
// Order Lookup by Number
// ============================================================================

export const getOrderByNumber = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderNumber } = req.params;

  const command = new GetOrderCommand(undefined, orderNumber);
  const useCase = getOrderUseCase;
  const order = await useCase.execute(command);

  if (!order) {
    respondError(req, res, 'Order not found', 404);
    return;
  }

  respond(req, res, order, 200);
};

export const getOrderItems = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const items = await OrderRepo.getOrderItems(orderId);
  respond(
    req,
    res,
    items.map(i => i.toJSON()),
  );
};

export const getOrderItemById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderItemId } = req.params;
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM "orderItem" WHERE "orderItemId" = $1', [orderItemId]);
  if (!row) {
    respondError(req, res, 'Order item not found', 404);
    return;
  }
  const orderId = row.orderId as string;
  const items = await OrderRepo.getOrderItems(orderId);
  const item = items.find(i => i.orderItemId === orderItemId);
  if (!item) {
    respondError(req, res, 'Order item not found', 404);
    return;
  }
  respond(req, res, item.toJSON());
};

export const createOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as {
    orderId: string;
    productId: string;
    sku?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discountedUnitPrice?: number;
    lineTotal?: number;
    discountTotal?: number;
    taxTotal?: number;
    taxRate?: number;
    taxExempt?: boolean;
    fulfillmentStatus?: string;
    giftWrapped?: boolean;
    isDigital?: boolean;
    description?: string;
    variantId?: string;
  };
  const { orderId, productId, name, quantity, unitPrice } = body;

  if (!orderId || !productId || !name || !quantity || !unitPrice) {
    respondError(req, res, 'Missing required fields', 400);
    return;
  }

  const orderItemId = generateUUID();
  const currency = 'USD';
  const item = OrderItem.reconstitute({
    orderItemId,
    orderId,
    productId: body.productId,
    productVariantId: body.variantId,
    name: body.name,
    sku: body.sku || '',
    quantity: body.quantity,
    unitPrice: Money.create(body.unitPrice, currency),
    discountedUnitPrice: Money.create(body.discountedUnitPrice ?? body.unitPrice, currency),
    lineTotal: Money.create(body.lineTotal ?? body.unitPrice * body.quantity, currency),
    discountTotal: Money.create(body.discountTotal ?? 0, currency),
    taxTotal: Money.create(body.taxTotal ?? 0, currency),
    taxRate: body.taxRate ?? 0,
    taxExempt: body.taxExempt ?? false,
    fulfillmentStatus: (body.fulfillmentStatus as FulfillmentStatus) ?? FulfillmentStatus.UNFULFILLED,
    giftWrapped: body.giftWrapped ?? false,
    isDigital: body.isDigital ?? false,
    description: body.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await OrderRepo.addOrderItem(orderId, item);
  respond(req, res, item.toJSON(), 201);
};

export const updateOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderItemId } = req.params;
  const body = req.body as { quantity?: number; unitPrice?: number };

  // Find the item across all orders (we need orderId to look it up)
  // Since we don't have orderId in the route, we search by orderItemId
  const row = await query<Array<{ orderId: string }>>('SELECT "orderId" FROM "orderItem" WHERE "orderItemId" = $1', [orderItemId]);
  if (!row || row.length === 0) {
    respondError(req, res, 'Order item not found', 404);
    return;
  }

  const orderId = row[0].orderId;
  const items = await OrderRepo.getOrderItems(orderId);
  const item = items.find(i => i.orderItemId === orderItemId);
  if (!item) {
    respondError(req, res, 'Order item not found', 404);
    return;
  }

  if (body.quantity !== undefined) {
    item.updateQuantity(body.quantity);
  }

  await OrderRepo.updateOrderItem(item);
  respond(req, res, item.toJSON());
};

export const deleteOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderItemId } = req.params;
  await OrderRepo.removeOrderItem(orderItemId);
  respond(req, res, { deleted: true });
};

// ============================================================================
// Payment & Fulfillment Status
// ============================================================================

export const updatePaymentStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { paymentStatus: string };
  const { paymentStatus } = body;

  const validStatuses = Object.values(PaymentStatus) as string[];
  if (!validStatuses.includes(paymentStatus)) {
    respondError(req, res, `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`, 400);
    return;
  }

  const order = await OrderRepo.findById(orderId);
  if (!order) {
    respondError(req, res, 'Order not found', 404);
    return;
  }

  const previousStatus = order.paymentStatus;
  order.updatePaymentStatus(paymentStatus as PaymentStatus);
  await OrderRepo.save(order);
  await OrderRepo.recordPaymentStatusChange(orderId, paymentStatus as PaymentStatus);

  respond(req, res, {
    orderId: order.orderId,
    previousStatus,
    paymentStatus: order.paymentStatus,
    updatedAt: order.updatedAt.toISOString(),
  });
};

export const updateFulfillmentStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { fulfillmentStatus: string };
  const { fulfillmentStatus } = body;

  const validStatuses = Object.values(FulfillmentStatus) as string[];
  if (!validStatuses.includes(fulfillmentStatus)) {
    respondError(req, res, `Invalid fulfillment status. Must be one of: ${validStatuses.join(', ')}`, 400);
    return;
  }

  const order = await OrderRepo.findById(orderId);
  if (!order) {
    respondError(req, res, 'Order not found', 404);
    return;
  }

  const previousStatus = order.fulfillmentStatus;
  order.updateFulfillmentStatus(fulfillmentStatus as FulfillmentStatus);
  await OrderRepo.save(order);
  await OrderRepo.recordFulfillmentStatusChange(orderId, fulfillmentStatus as FulfillmentStatus);

  respond(req, res, {
    orderId: order.orderId,
    previousStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    updatedAt: order.updatedAt.toISOString(),
  });
};

// ============================================================================
// Status History Endpoints
// ============================================================================

export const getStatusHistory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const history = await OrderRepo.getStatusHistory(orderId);
  const result = history.map(h => ({
    orderId,
    status: h.status,
    reason: h.reason,
    createdAt: h.createdAt.toISOString(),
  }));
  respond(req, res, result);
};

export const getPaymentHistory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const history = await OrderRepo.getPaymentStatusHistory(orderId);
  const result = history.map(h => ({
    orderId: h.orderId,
    paymentStatus: h.paymentStatus,
    transactionId: h.transactionId,
    createdAt: h.createdAt.toISOString(),
  }));
  respond(req, res, result);
};

export const getFulfillmentHistory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const history = await OrderRepo.getFulfillmentStatusHistory(orderId);
  const result = history.map(h => ({
    orderId: h.orderId,
    fulfillmentStatus: h.fulfillmentStatus,
    createdAt: h.createdAt.toISOString(),
  }));
  respond(req, res, result);
};
