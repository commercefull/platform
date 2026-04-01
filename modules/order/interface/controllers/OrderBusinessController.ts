/**
 * Order Business Controller
 * HTTP interface for business/admin order operations with content negotiation
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import OrderRepo from '../../infrastructure/repositories/OrderRepository';
import { GetOrderCommand, GetOrderUseCase } from '../../application/useCases/GetOrder';
import { ListOrdersCommand, ListOrdersUseCase } from '../../application/useCases/ListOrders';
import { GetStoreSalesSummaryUseCase } from '../../application/useCases/GetStoreSalesSummary';
import { UpdateOrderStatusCommand, UpdateOrderStatusUseCase } from '../../application/useCases/UpdateOrderStatus';
import { CancelOrderCommand, CancelOrderUseCase } from '../../application/useCases/CancelOrder';
import { ProcessRefundCommand, ProcessRefundUseCase } from '../../application/useCases/ProcessRefund';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import orderNoteRepo from '../../infrastructure/repositories/orderNoteRepo';
import orderPaymentRefundRepo from '../../infrastructure/repositories/orderPaymentRefundRepo';
import orderFulfillmentPackageRepo from '../../infrastructure/repositories/orderFulfillmentPackageRepo';
import { AddOrderNoteCommand, AddOrderNoteUseCase } from '../../application/useCases/AddOrderNote';
import { CreateOrderRefundCommand, CreateOrderRefundUseCase } from '../../application/useCases/CreateOrderRefund';
import { TrackFulfillmentPackageCommand, TrackFulfillmentPackageUseCase } from '../../application/useCases/TrackFulfillmentPackage';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

type ResponseData = Record<string, any>;

function respond(req: TypedRequest, res: Response, data: ResponseData, statusCode: number = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500, htmlTemplate?: string): void {
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
 * List all orders with filters
 * GET /orders
 */
export const listOrders = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
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

    const filters: any = {};
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

    const useCase = new ListOrdersUseCase(OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'admin/order/list');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to list orders', 500, 'admin/order/error');
  }
};

/**
 * Get order details
 * GET /orders/:orderId
 */
export const getOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const command = new GetOrderCommand(orderId);
    const useCase = new GetOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    if (!order) {
      respondError(req, res, 'Order not found', 404, 'admin/order/error');
      return;
    }

    respond(req, res, order, 200, 'admin/order/detail');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get order', 500, 'admin/order/error');
  }
};

/**
 * Update order status
 * PUT /orders/:orderId/status
 */
export const updateOrderStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    // Validate status
    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status)) {
      respondError(req, res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'admin/order/error');
      return;
    }

    const command = new UpdateOrderStatusCommand(orderId, status as OrderStatus, reason);
    const useCase = new UpdateOrderStatusUseCase(OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'admin/order/detail');
  } catch (error: any) {
    logger.error('Error:', error);

    if (error.message.includes('Cannot transition')) {
      respondError(req, res, error.message, 400, 'admin/order/error');
      return;
    }

    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404, 'admin/order/error');
      return;
    }

    respondError(req, res, error.message || 'Failed to update order status', 500, 'admin/order/error');
  }
};

/**
 * Cancel an order (admin)
 * POST /orders/:orderId/cancel
 */
export const cancelOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      respondError(req, res, 'Cancellation reason is required', 400, 'admin/order/error');
      return;
    }

    const command = new CancelOrderCommand(orderId, reason);
    const useCase = new CancelOrderUseCase(OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'admin/order/cancelled');
  } catch (error: any) {
    logger.error('Error:', error);

    if (error.message.includes('cannot be cancelled')) {
      respondError(req, res, error.message, 400, 'admin/order/error');
      return;
    }

    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404, 'admin/order/error');
      return;
    }

    respondError(req, res, error.message || 'Failed to cancel order', 500, 'admin/order/error');
  }
};

/**
 * Process refund
 * POST /orders/:orderId/refund
 */
export const processRefund = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { amount, reason, transactionId } = req.body;

    if (!amount || amount <= 0) {
      respondError(req, res, 'Refund amount must be greater than zero', 400, 'admin/order/error');
      return;
    }

    if (!reason) {
      respondError(req, res, 'Refund reason is required', 400, 'admin/order/error');
      return;
    }

    const command = new ProcessRefundCommand(orderId, amount, reason, transactionId);
    const useCase = new ProcessRefundUseCase(OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'admin/order/refund');
  } catch (error: any) {
    logger.error('Error:', error);

    if (error.message.includes('cannot be refunded') || error.message.includes('cannot exceed')) {
      respondError(req, res, error.message, 400, 'admin/order/error');
      return;
    }

    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404, 'admin/order/error');
      return;
    }

    respondError(req, res, error.message || 'Failed to process refund', 500, 'admin/order/error');
  }
};

/**
 * Get order statistics
 * GET /orders/stats
 */
export const getOrderStats = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, customerId, storeId, channelId, createdByUserId, orderSource } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (customerId) filters.customerId = customerId as string;
    if (storeId) filters.storeId = storeId as string;
    if (channelId) filters.channelId = channelId as string;
    if (createdByUserId) filters.createdByUserId = createdByUserId as string;
    if (orderSource) filters.orderSource = orderSource as string;

    const stats = await OrderRepo.getOrderStats(Object.keys(filters).length > 0 ? filters : undefined);

    respond(req, res, stats, 200, 'admin/order/stats');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get order statistics', 500, 'admin/order/error');
  }
};

export const getStoreSalesSummary = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

    const useCase = new GetStoreSalesSummaryUseCase();
    const summary = await useCase.execute({
      storeId: req.query.storeId as string | undefined,
      dateFrom,
      dateTo,
    });

    respond(req, res, summary, 200, 'admin/order/stats');
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to get store sales summary', 500, 'admin/order/error');
  }
};

/**
 * Get order status history
 * GET /orders/:orderId/history
 */
export const getOrderHistory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const history = await OrderRepo.getStatusHistory(orderId);

    respond(req, res, { orderId, history }, 200, 'admin/order/history');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get order history', 500, 'admin/order/error');
  }
};

// ============================================================================
// Order Notes
// ============================================================================

/**
 * List notes for an order
 * GET /business/orders/:orderId/notes
 */
export const listOrderNotes = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const notes = await orderNoteRepo.findByOrder(orderId);
    respond(req, res, { orderId, notes });
  } catch (error: any) {
    logger.error('Error listing order notes:', error);
    respondError(req, res, error.message || 'Failed to list order notes', 500);
  }
};

/**
 * Add a note to an order
 * POST /business/orders/:orderId/notes
 */
export const addOrderNote = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { content, isCustomerVisible } = req.body;

    const command = new AddOrderNoteCommand(orderId, content, isCustomerVisible ?? false, (req as any).user?.userId);
    const useCase = new AddOrderNoteUseCase();
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: any) {
    logger.error('Error adding order note:', error);
    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404);
      return;
    }
    respondError(req, res, error.message || 'Failed to add order note', 500);
  }
};

/**
 * Soft-delete a note from an order
 * DELETE /business/orders/:orderId/notes/:noteId
 */
export const deleteOrderNote = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;
    const deleted = await orderNoteRepo.softDelete(noteId);
    if (!deleted) {
      respondError(req, res, 'Order note not found', 404);
      return;
    }
    respond(req, res, { deleted: true });
  } catch (error: any) {
    logger.error('Error deleting order note:', error);
    respondError(req, res, error.message || 'Failed to delete order note', 500);
  }
};

// ============================================================================
// Order Refunds
// ============================================================================

/**
 * List refunds for an order
 * GET /business/orders/:orderId/refunds
 */
export const listOrderRefunds = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const refunds = await orderPaymentRefundRepo.findByOrder(orderId);
    respond(req, res, { orderId, refunds });
  } catch (error: any) {
    logger.error('Error listing order refunds:', error);
    respondError(req, res, error.message || 'Failed to list order refunds', 500);
  }
};

/**
 * Create a refund for an order payment
 * POST /business/orders/:orderId/refunds
 */
export const createOrderRefund = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderPaymentId, amount, reason, notes, transactionId } = req.body;

    const command = new CreateOrderRefundCommand(
      orderPaymentId,
      parseFloat(amount),
      reason,
      notes,
      transactionId,
      (req as any).user?.userId,
    );
    const useCase = new CreateOrderRefundUseCase();
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: any) {
    logger.error('Error creating order refund:', error);
    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404);
      return;
    }
    if (error.message.includes('exceeds') || error.message.includes('greater than zero')) {
      respondError(req, res, error.message, 400);
      return;
    }
    respondError(req, res, error.message || 'Failed to create order refund', 500);
  }
};

// ============================================================================
// Fulfillment Packages
// ============================================================================

/**
 * List packages for a fulfillment
 * GET /business/orders/:orderId/packages
 */
export const listFulfillmentPackages = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.query;
    if (!fulfillmentId) {
      respondError(req, res, 'fulfillmentId query parameter is required', 400);
      return;
    }
    const packages = await orderFulfillmentPackageRepo.findByFulfillment(fulfillmentId as string);
    respond(req, res, { fulfillmentId, packages });
  } catch (error: any) {
    logger.error('Error listing fulfillment packages:', error);
    respondError(req, res, error.message || 'Failed to list fulfillment packages', 500);
  }
};

/**
 * Create a fulfillment package
 * POST /business/orders/:orderId/packages
 */
export const createFulfillmentPackage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderFulfillmentId, packageNumber, trackingNumber, weight, dimensions, packageType, shippingLabelUrl, commercialInvoiceUrl, customsInfo } =
      req.body;

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
    const useCase = new TrackFulfillmentPackageUseCase();
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: any) {
    logger.error('Error creating fulfillment package:', error);
    respondError(req, res, error.message || 'Failed to create fulfillment package', 500);
  }
};

/**
 * Update tracking on a fulfillment package
 * POST /business/orders/:orderId/packages/:packageId/tracking
 */
export const trackFulfillmentPackage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { packageId } = req.params;
    const { orderFulfillmentId, packageNumber, trackingNumber, shippingLabelUrl, commercialInvoiceUrl } = req.body;

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
    const useCase = new TrackFulfillmentPackageUseCase();
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    logger.error('Error tracking fulfillment package:', error);
    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404);
      return;
    }
    respondError(req, res, error.message || 'Failed to update package tracking', 500);
  }
};
