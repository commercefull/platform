/**
 * Order Business Controller
 * HTTP interface for business/admin order operations with content negotiation
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { GetOrderCommand } from '../../application/useCases/GetOrder';
import { ListOrdersCommand } from '../../application/useCases/ListOrders';
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
import { UpdatePaymentStatusCommand } from '../../application/useCases/UpdatePaymentStatus';
import { UpdateFulfillmentStatusCommand } from '../../application/useCases/UpdateFulfillmentStatus';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import {
  listOrdersUseCase,
  getOrderUseCase,
  updateOrderStatusUseCase,
  updatePaymentStatusUseCase,
  updateFulfillmentStatusUseCase,
  cancelOrderUseCase,
  processRefundUseCase,
  addOrderNoteUseCase,
  createOrderRefundUseCase,
  trackFulfillmentPackageUseCase,
  manageOrderNotesUseCase,
  getOrderRefundsUseCase,
  getFulfillmentPackagesUseCase,
  manageOrderItemsUseCase,
  getOrderHistoryUseCase,
  getStoreSalesSummaryUseCase,
} from '../../application/useCases/wired';
import { isUuid } from '../../../../libs/uuid';
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
  if (minAmount) filters.minAmountCents = Math.round(parseFloat(minAmount as string) * 100);
  if (maxAmount) filters.maxAmountCents = Math.round(parseFloat(maxAmount as string) * 100);
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

  const stats = await getOrderHistoryUseCase.getStats(Object.keys(filters).length > 0 ? filters : undefined);

  respond(req, res, stats, 200);
};

export const getStoreSalesSummary = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

// ============================================================================
// Order Notes
// ============================================================================

/**
 * List notes for an order
 * GET /business/orders/:orderId/notes
 */
export const listOrderNotes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const notes = await manageOrderNotesUseCase.findByOrder(orderId);
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
  const deleted = await manageOrderNotesUseCase.softDelete(noteId);
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
  const refunds = await getOrderRefundsUseCase.findByOrder(orderId);
  respond(req, res, { orderId, refunds });
};

/**
 * Create a refund for an order payment
 * POST /business/orders/:orderId/refunds
 */
export const createOrderRefund = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as { orderPaymentId: string; amount: string; reason: string; notes?: string; transactionId?: string };
  const { orderPaymentId, amount, reason, notes, transactionId } = body;

  const command = new CreateOrderRefundCommand(
    orderPaymentId,
    Math.round(parseFloat(amount) * 100),
    reason,
    notes,
    transactionId,
    req.user?.userId,
  );
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
  const packages = await getFulfillmentPackagesUseCase.findByFulfillment(fulfillmentId as string);
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
  const items = await manageOrderItemsUseCase.listItems(orderId);
  respond(
    req,
    res,
    items.map(i => i.toJSON()),
  );
};

export const getOrderItemById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderItemId } = req.params;
  const item = await manageOrderItemsUseCase.getItem(orderItemId);
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
    unitPriceCents: number;
    discountedUnitPriceCents?: number;
    lineTotalCents?: number;
    discountTotalCents?: number;
    taxTotalCents?: number;
    taxRate?: number;
    taxExempt?: boolean;
    fulfillmentStatus?: string;
    giftWrapped?: boolean;
    isDigital?: boolean;
    description?: string;
    variantId?: string;
  };
  const { orderId, productId, name, quantity, unitPriceCents } = body;

  if (!orderId || !productId || !name || !quantity || unitPriceCents === undefined) {
    respondError(req, res, 'Missing required fields', 400);
    return;
  }

  const item = await manageOrderItemsUseCase.addItem(body);
  respond(req, res, item.toJSON(), 201);
};

export const updateOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderItemId } = req.params;
  const body = req.body as { quantity?: number; unitPriceCents?: number };

  const item = await manageOrderItemsUseCase.updateItem(orderItemId, body);
  if (!item) {
    respondError(req, res, 'Order item not found', 404);
    return;
  }

  respond(req, res, item.toJSON());
};

export const deleteOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderItemId } = req.params;
  await manageOrderItemsUseCase.removeItem(orderItemId);
  respond(req, res, { deleted: true });
};

// ============================================================================
// Payment & Fulfillment Status
// ============================================================================

export const updatePaymentStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { paymentStatus: string };
  const { paymentStatus } = body;

  try {
    const result = await updatePaymentStatusUseCase.execute(
      new UpdatePaymentStatusCommand(orderId, paymentStatus as PaymentStatus),
    );
    respond(req, res, result, 200);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateFulfillmentStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as { fulfillmentStatus: string };
  const { fulfillmentStatus } = body;

  try {
    const result = await updateFulfillmentStatusUseCase.execute(
      new UpdateFulfillmentStatusCommand(orderId, fulfillmentStatus as FulfillmentStatus),
    );
    respond(req, res, result, 200);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ============================================================================
// Status History Endpoints
// ============================================================================

export const getStatusHistory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const history = await getOrderHistoryUseCase.getStatusHistory(orderId);
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
  const history = await getOrderHistoryUseCase.getPaymentStatusHistory(orderId);
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
  const history = await getOrderHistoryUseCase.getFulfillmentStatusHistory(orderId);
  const result = history.map(h => ({
    orderId: h.orderId,
    fulfillmentStatus: h.fulfillmentStatus,
    createdAt: h.createdAt.toISOString(),
  }));
  respond(req, res, result);
};
