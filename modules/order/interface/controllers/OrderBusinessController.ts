/**
 * Order Business Controller
 * HTTP interface for business/admin order operations with content negotiation
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import OrderRepo from '../../infrastructure/repositories/OrderRepository';
import { GetOrderCommand, GetOrderUseCase } from '../../application/useCases/GetOrder';
import { ListOrdersCommand, ListOrdersUseCase } from '../../application/useCases/ListOrders';
import { UpdateOrderStatusCommand, UpdateOrderStatusUseCase } from '../../application/useCases/UpdateOrderStatus';
import { CancelOrderCommand, CancelOrderUseCase } from '../../application/useCases/CancelOrder';
import { ProcessRefundCommand, ProcessRefundUseCase } from '../../application/useCases/ProcessRefund';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

type ResponseData = Record<string, any>;

function respond(
  req: Request,
  res: Response,
  data: ResponseData,
  statusCode: number = 200,
  htmlTemplate?: string
): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

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
 * List all orders with filters
 * GET /orders
 */
export const listOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
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
      orderDirection
    } = req.query;

    const filters: any = {};
    if (customerId) filters.customerId = customerId as string;
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
      (orderDirection as 'asc' | 'desc') || 'desc'
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
export const getOrder = async (req: Request, res: Response): Promise<void> => {
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
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
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
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
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
export const processRefund = async (req: Request, res: Response): Promise<void> => {
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
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, customerId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (customerId) filters.customerId = customerId as string;

    const stats = await OrderRepo.getOrderStats(Object.keys(filters).length > 0 ? filters : undefined);

    respond(req, res, stats, 200, 'admin/order/stats');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to get order statistics', 500, 'admin/order/error');
  }
};

/**
 * Get order status history
 * GET /orders/:orderId/history
 */
export const getOrderHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const history = await OrderRepo.getStatusHistory(orderId);

    respond(req, res, { orderId, history }, 200, 'admin/order/history');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to get order history', 500, 'admin/order/error');
  }
};
