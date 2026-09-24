/**
 * Order Controller for Admin Hub
 * Uses order use cases directly from modules - no HTTP API calls
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { ListOrdersCommand } from '../../application/useCases/ListOrders';
import { GetOrderCommand } from '../../application/useCases/GetOrder';
import { UpdateOrderStatusCommand } from '../../application/useCases/UpdateOrderStatus';
import { CancelOrderCommand } from '../../application/useCases/CancelOrder';
import { ProcessRefundCommand } from '../../application/useCases/ProcessRefund';
import { AddOrderNoteCommand } from '../../application/useCases/AddOrderNote';
import {
  listOrdersUseCase,
  getOrderUseCase,
  updateOrderStatusUseCase,
  cancelOrderUseCase,
  processRefundUseCase,
  addOrderNoteUseCase,
  manageOrderNotesUseCase,
  getOrderRefundsUseCase,
  getFulfillmentPackagesUseCase,
  trackFulfillmentPackageUseCase,
} from '../../application/useCases/wired';
import { TrackFulfillmentPackageCommand } from '../../application/useCases/TrackFulfillmentPackage';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// List Orders
// ============================================================================

export const listOrders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

  const result = await listOrdersUseCase.execute(command);

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
};

// ============================================================================
// View Order
// ============================================================================

export const viewOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;

  const command = new GetOrderCommand(orderId);
  const order = await getOrderUseCase.execute(command);

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
};

// ============================================================================
// Update Order Status
// ============================================================================

export const updateOrderStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as HttpRequestBody;
  const { status, note } = body as { status: OrderStatus; note?: string };
  const _updatedBy = req.user?.id || 'admin';

  const validStatuses = Object.values(OrderStatus);
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const command = new UpdateOrderStatusCommand(orderId, status, note);
  await updateOrderStatusUseCase.execute(command);

  // Check if this is an AJAX request
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: true, message: 'Order status updated' });
  } else {
    res.redirect(`/hub/orders/${orderId}?success=Order status updated`);
  }
};

// ============================================================================
// Cancel Order
// ============================================================================

export const cancelOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as HttpRequestBody;
  const { reason } = body as { reason?: string };
  const _cancelledBy = req.user?.id || 'admin';

  const command = new CancelOrderCommand(orderId, reason || 'Cancelled by admin');
  await cancelOrderUseCase.execute(command);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: true, message: 'Order cancelled' });
  } else {
    res.redirect(`/hub/orders/${orderId}?success=Order cancelled`);
  }
};

// ============================================================================
// Process Refund Form
// ============================================================================

export const refundForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;

  const command = new GetOrderCommand(orderId);
  const order = await getOrderUseCase.execute(command);

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
};

// ============================================================================
// Process Refund
// ============================================================================

export const processRefund = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const body = req.body as HttpRequestBody;
  const { amount, reason, _refundItems } = body as { amount: string; reason?: string; _refundItems?: unknown };
  const _processedBy = req.user?.id || 'admin';

  const command = new ProcessRefundCommand(orderId, Math.round(parseFloat(amount) * 100), reason || 'Refund processed by admin');

  await processRefundUseCase.execute(command);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: true, message: 'Refund processed' });
  } else {
    res.redirect(`/hub/orders/${orderId}?success=Refund processed successfully`);
  }
};

// ============================================================================
// Order Notes
// ============================================================================

export const listOrderNotes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const notes = await manageOrderNotesUseCase.findByOrder(orderId);
  adminRespond(req, res, 'orders/partials/notes', { orderId, notes });
};

export const addOrderNote = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { orderId } = req.params;
    const body = req.body as HttpRequestBody;
    const { content, isCustomerVisible } = body as { content: string; isCustomerVisible?: string | boolean };
    const createdBy = req.user?.id || 'admin';

    const command = new AddOrderNoteCommand(orderId, content, isCustomerVisible === 'true' || isCustomerVisible === true, createdBy);
    await addOrderNoteUseCase.execute(command);

    req.flash?.('success', 'Note added');
    res.redirect(`/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to add note');
    res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};

export const deleteOrderNote = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { orderId, noteId } = req.params;
    await manageOrderNotesUseCase.softDelete(noteId);
    req.flash?.('success', 'Note deleted');
    res.redirect(`/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to delete note');
    res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};

// ============================================================================
// Order Refunds
// ============================================================================

export const listOrderRefunds = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const refunds = await getOrderRefundsUseCase.findByOrder(orderId);
  adminRespond(req, res, 'orders/partials/refunds', { orderId, refunds });
};

// ============================================================================
// Fulfillment Packages
// ============================================================================

export const listFulfillmentPackages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const packages = await getFulfillmentPackagesUseCase.findByOrder(orderId);
  adminRespond(req, res, 'orders/partials/packages', { orderId, packages });
};

export const updatePackageTracking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { orderId, packageId } = req.params;
    const body = req.body as HttpRequestBody;
    const { trackingNumber, shippingLabelUrl, commercialInvoiceUrl } = body as {
      trackingNumber?: string;
      shippingLabelUrl?: string;
      commercialInvoiceUrl?: string;
    };

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
    await trackFulfillmentPackageUseCase.execute(command);

    req.flash?.('success', 'Tracking updated');
    res.redirect(`/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to update tracking');
    res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};
