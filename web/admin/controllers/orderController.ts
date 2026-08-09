/**
 * Order Controller for Admin Hub
 * Uses order use cases directly from modules - no HTTP API calls
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import OrderRepo from '../../../modules/order/infrastructure/repositories/OrderRepository';
import { ListOrdersCommand, ListOrdersUseCase } from '../../../modules/order/application/useCases/ListOrders';
import { GetOrderCommand, GetOrderUseCase } from '../../../modules/order/application/useCases/GetOrder';
import { UpdateOrderStatusCommand, UpdateOrderStatusUseCase } from '../../../modules/order/application/useCases/UpdateOrderStatus';
import { CancelOrderCommand, CancelOrderUseCase } from '../../../modules/order/application/useCases/CancelOrder';
import { ProcessRefundCommand, ProcessRefundUseCase } from '../../../modules/order/application/useCases/ProcessRefund';
import { AddOrderNoteCommand, AddOrderNoteUseCase } from '../../../modules/order/application/useCases/AddOrderNote';
import {
  TrackFulfillmentPackageCommand,
  TrackFulfillmentPackageUseCase,
} from '../../../modules/order/application/useCases/TrackFulfillmentPackage';
import * as orderNoteRepo from '../../../modules/order/infrastructure/repositories/orderNoteRepo';
import * as orderPaymentRefundRepo from '../../../modules/order/infrastructure/repositories/orderPaymentRefundRepo';
import * as orderFulfillmentPackageRepo from '../../../modules/order/infrastructure/repositories/orderFulfillmentPackageRepo';
import { OrderStatus } from '../../../modules/order/domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../../modules/order/domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../../modules/order/domain/valueObjects/FulfillmentStatus';
import { adminRespond } from '../../respond';

// ============================================================================
// List Orders
// ============================================================================

export const listOrders = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { status, paymentStatus, fulfillmentStatus, customerId, search, startDate, endDate, limit, offset, orderBy, orderDirection } =
      req.query;

    const filters: Record<string, unknown> = {};
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load orders',
    });
  }
};

// ============================================================================
// View Order
// ============================================================================

export const viewOrder = async (req: TypedRequest, res: Response): Promise<void> => {
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load order',
    });
  }
};

// ============================================================================
// Update Order Status
// ============================================================================

export const updateOrderStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const body = req.body as RequestBody;
    const { status, note } = body;
    const _updatedBy = req.user?.id || 'admin';

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
  } catch (error: unknown) {
    logger.error('Error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: (error as Error).message || 'Failed to update status' });
    } else {
      res.redirect(`/hub/orders/${req.params.orderId}?error=${encodeURIComponent((error as Error).message)}`);
    }
  }
};

// ============================================================================
// Cancel Order
// ============================================================================

export const cancelOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const body = req.body as RequestBody;
    const { reason } = body;
    const _cancelledBy = req.user?.id || 'admin';

    const command = new CancelOrderCommand(orderId, reason || 'Cancelled by admin');
    const useCase = new CancelOrderUseCase(OrderRepo);
    await useCase.execute(command);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true, message: 'Order cancelled' });
    } else {
      res.redirect(`/hub/orders/${orderId}?success=Order cancelled`);
    }
  } catch (error: unknown) {
    logger.error('Error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: (error as Error).message || 'Failed to cancel order' });
    } else {
      res.redirect(`/hub/orders/${req.params.orderId}?error=${encodeURIComponent((error as Error).message)}`);
    }
  }
};

// ============================================================================
// Process Refund Form
// ============================================================================

export const refundForm = async (req: TypedRequest, res: Response): Promise<void> => {
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load refund form',
    });
  }
};

// ============================================================================
// Process Refund
// ============================================================================

export const processRefund = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const body = req.body as RequestBody;
    const { amount, reason, _refundItems } = body;
    const _processedBy = req.user?.id || 'admin';

    const command = new ProcessRefundCommand(orderId, parseFloat(amount), reason || 'Refund processed by admin');

    const useCase = new ProcessRefundUseCase(OrderRepo);
    await useCase.execute(command);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true, message: 'Refund processed' });
    } else {
      res.redirect(`/hub/orders/${orderId}?success=Refund processed successfully`);
    }
  } catch (error: unknown) {
    logger.error('Error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: (error as Error).message || 'Failed to process refund' });
    } else {
      // Reload refund form with error
      try {
        const command = new GetOrderCommand(req.params.orderId);
        const useCase = new GetOrderUseCase(OrderRepo);
        const order = await useCase.execute(command);

        adminRespond(req, res, 'orders/refund', {
          pageName: `Refund Order #${order?.orderNumber || 'Unknown'}`,
          order,
          error: (error as Error).message || 'Failed to process refund',
          formData: req.body as RequestBody,
        });
      } catch {
        res.redirect(`/hub/orders/${req.params.orderId}?error=${encodeURIComponent((error as Error).message)}`);
      }
    }
  }
};

// ============================================================================
// Order Notes
// ============================================================================

export const listOrderNotes = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const notes = await orderNoteRepo.findByOrder(orderId);
    adminRespond(req, res, 'orders/partials/notes', { orderId, notes });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load notes' });
  }
};

export const addOrderNote = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const body = req.body as RequestBody;
    const { content, isCustomerVisible } = body;
    const createdBy = req.user?.id || 'admin';

    const command = new AddOrderNoteCommand(orderId, content, isCustomerVisible === 'true' || isCustomerVisible === true, createdBy);
    const useCase = new AddOrderNoteUseCase();
    await useCase.execute(command);

    req.flash?.('success', 'Note added');
    res.redirect(`/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to add note');
    res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};

export const deleteOrderNote = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, noteId } = req.params;
    await orderNoteRepo.softDelete(noteId);
    req.flash?.('success', 'Note deleted');
    res.redirect(`/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to delete note');
    res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};

// ============================================================================
// Order Refunds
// ============================================================================

export const listOrderRefunds = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const refunds = await orderPaymentRefundRepo.findByOrder(orderId);
    adminRespond(req, res, 'orders/partials/refunds', { orderId, refunds });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load refunds' });
  }
};

// ============================================================================
// Fulfillment Packages
// ============================================================================

export const listFulfillmentPackages = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const packages = await orderFulfillmentPackageRepo.findByOrder(orderId);
    adminRespond(req, res, 'orders/partials/packages', { orderId, packages });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load packages' });
  }
};

export const updatePackageTracking = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, packageId } = req.params;
    const body = req.body as RequestBody;
    const { trackingNumber, shippingLabelUrl, commercialInvoiceUrl } = body;

    const command = new TrackFulfillmentPackageCommand(
      '', // orderFulfillmentId not needed for update path
      '', // packageNumber not needed for update path
      trackingNumber || undefined,
      shippingLabelUrl || undefined,
      commercialInvoiceUrl || undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      packageId,
    );
    const useCase = new TrackFulfillmentPackageUseCase();
    await useCase.execute(command);

    req.flash?.('success', 'Tracking updated');
    res.redirect(`/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to update tracking');
    res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};
