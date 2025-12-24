/**
 * Order Controller for Admin Hub
 * Uses order use cases directly from modules - no HTTP API calls
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import OrderRepo from '../../../modules/order/infrastructure/repositories/OrderRepository';
import { ListOrdersCommand, ListOrdersUseCase } from '../../../modules/order/application/useCases/ListOrders';
import { GetOrderCommand, GetOrderUseCase } from '../../../modules/order/application/useCases/GetOrder';
import { UpdateOrderStatusCommand, UpdateOrderStatusUseCase } from '../../../modules/order/application/useCases/UpdateOrderStatus';
import { CancelOrderCommand, CancelOrderUseCase } from '../../../modules/order/application/useCases/CancelOrder';
import { ProcessRefundCommand, ProcessRefundUseCase } from '../../../modules/order/application/useCases/ProcessRefund';
import { OrderStatus } from '../../../modules/order/domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../../modules/order/domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../../modules/order/domain/valueObjects/FulfillmentStatus';
import { adminRespond } from '../../respond';

// ============================================================================
// List Orders
// ============================================================================

export const listOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, paymentStatus, fulfillmentStatus, customerId, search, startDate, endDate, limit, offset, orderBy, orderDirection } =
      req.query;

    const filters: any = {};
    if (status) filters.status = status as OrderStatus;
    if (paymentStatus) filters.paymentStatus = paymentStatus as PaymentStatus;
    if (fulfillmentStatus) filters.fulfillmentStatus = fulfillmentStatus as FulfillmentStatus;
    if (customerId) filters.customerId = customerId as string;
    if (search) filters.search = search as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const command = new ListOrdersCommand(
      Object.keys(filters).length > 0 ? filters : undefined,
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0,
      (orderBy as string) || 'createdAt',
      (orderDirection as 'asc' | 'desc') || 'desc',
    );

    const useCase = new ListOrdersUseCase(OrderRepo);
    const result = await useCase.execute(command);

    // Calculate pagination info
    const page = Math.floor(result.offset / result.limit) + 1;
    const pages = Math.ceil(result.total / result.limit);

    adminRespond(req, res, 'orders/index', {
      pageName: 'Orders',
      orders: result.orders,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page,
        pages,
        hasMore: result.hasMore,
      },
      filters: {
        status: status || '',
        paymentStatus: paymentStatus || '',
        fulfillmentStatus: fulfillmentStatus || '',
        customerId: customerId || '',
        search: search || '',
        startDate: startDate || '',
        endDate: endDate || '',
        orderBy: orderBy || 'createdAt',
        orderDirection: orderDirection || 'desc',
      },
      // Status options for filters
      orderStatuses: Object.values(OrderStatus),
      paymentStatuses: Object.values(PaymentStatus),
      fulfillmentStatuses: Object.values(FulfillmentStatus),

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load orders',
    });
  }
};

// ============================================================================
// View Order
// ============================================================================

export const viewOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const command = new GetOrderCommand(orderId);
    const useCase = new GetOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    if (!order) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Order not found',
      });
      return;
    }

    adminRespond(req, res, 'orders/view', {
      pageName: `Order #${order.orderNumber}`,
      order,
      orderStatuses: Object.values(OrderStatus),
      paymentStatuses: Object.values(PaymentStatus),
      fulfillmentStatuses: Object.values(FulfillmentStatus),

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load order',
    });
  }
};

// ============================================================================
// Update Order Status
// ============================================================================

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const updatedBy = (req as any).user?.id || 'admin';

    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const command = new UpdateOrderStatusCommand(orderId, status, note);
    const useCase = new UpdateOrderStatusUseCase(OrderRepo);
    await useCase.execute(command);

    // Check if this is an AJAX request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true, message: 'Order status updated' });
    } else {
      res.redirect(`/hub/orders/${orderId}?success=Order status updated`);
    }
  } catch (error: any) {
    logger.error('Error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
    } else {
      res.redirect(`/hub/orders/${req.params.orderId}?error=${encodeURIComponent(error.message)}`);
    }
  }
};

// ============================================================================
// Cancel Order
// ============================================================================

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const cancelledBy = (req as any).user?.id || 'admin';

    const command = new CancelOrderCommand(orderId, reason || 'Cancelled by admin');
    const useCase = new CancelOrderUseCase(OrderRepo);
    await useCase.execute(command);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true, message: 'Order cancelled' });
    } else {
      res.redirect(`/hub/orders/${orderId}?success=Order cancelled`);
    }
  } catch (error: any) {
    logger.error('Error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message || 'Failed to cancel order' });
    } else {
      res.redirect(`/hub/orders/${req.params.orderId}?error=${encodeURIComponent(error.message)}`);
    }
  }
};

// ============================================================================
// Process Refund Form
// ============================================================================

export const refundForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const command = new GetOrderCommand(orderId);
    const useCase = new GetOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    if (!order) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Order not found',
      });
      return;
    }

    adminRespond(req, res, 'orders/refund', {
      pageName: `Refund Order #${order.orderNumber}`,
      order,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load refund form',
    });
  }
};

// ============================================================================
// Process Refund
// ============================================================================

export const processRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { amount, reason, refundItems } = req.body;
    const processedBy = (req as any).user?.id || 'admin';

    const command = new ProcessRefundCommand(orderId, parseFloat(amount), reason || 'Refund processed by admin');

    const useCase = new ProcessRefundUseCase(OrderRepo);
    await useCase.execute(command);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true, message: 'Refund processed' });
    } else {
      res.redirect(`/hub/orders/${orderId}?success=Refund processed successfully`);
    }
  } catch (error: any) {
    logger.error('Error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message || 'Failed to process refund' });
    } else {
      // Reload refund form with error
      try {
        const command = new GetOrderCommand(req.params.orderId);
        const useCase = new GetOrderUseCase(OrderRepo);
        const order = await useCase.execute(command);

        adminRespond(req, res, 'orders/refund', {
          pageName: `Refund Order #${order?.orderNumber || 'Unknown'}`,
          order,
          error: error.message || 'Failed to process refund',
          formData: req.body,
        });
      } catch {
        res.redirect(`/hub/orders/${req.params.orderId}?error=${encodeURIComponent(error.message)}`);
      }
    }
  }
};
