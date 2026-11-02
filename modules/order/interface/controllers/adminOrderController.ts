import { jsonResponse, redirectResponse } from 'libs/apiResponse';
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

function buildOrderListFilters(query: HttpRequest['query']): Record<string, unknown> | undefined {
  const filters: Record<string, unknown> = {};
  if (query.status) filters.status = query.status as OrderStatus;
  if (query.paymentStatus) filters.paymentStatus = query.paymentStatus as PaymentStatus;
  if (query.fulfillmentStatus) filters.fulfillmentStatus = query.fulfillmentStatus as FulfillmentStatus;
  if (query.customerId) filters.customerId = query.customerId as string;
  if (query.search) filters.search = query.search as string;
  if (query.startDate) filters.startDate = new Date(query.startDate as string);
  if (query.endDate) filters.endDate = new Date(query.endDate as string);
  return Object.keys(filters).length > 0 ? filters : undefined;
}

/** Echo the submitted filter values back to the view. */
function echoedOrderFilters(query: HttpRequest['query']): Record<string, unknown> {
  const or = (v: unknown, fallback: string = ''): unknown => v || fallback;
  return {
    status: or(query.status),
    paymentStatus: or(query.paymentStatus),
    fulfillmentStatus: or(query.fulfillmentStatus),
    customerId: or(query.customerId),
    search: or(query.search),
    startDate: or(query.startDate),
    endDate: or(query.endDate),
    orderBy: or(query.orderBy, 'createdAt'),
    orderDirection: or(query.orderDirection, 'desc'),
  };
}

export const listOrders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { limit, offset, orderBy, orderDirection } = req.query;

  const command = new ListOrdersCommand(
    buildOrderListFilters(req.query),
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
    filters: echoedOrderFilters(req.query),
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
    jsonResponse(res, 400, { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const command = new UpdateOrderStatusCommand(orderId, status, note);
  await updateOrderStatusUseCase.execute(command);

  // Check if this is an AJAX request
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    jsonResponse(res, 200, { success: true, message: 'Order status updated' });
  } else {
    redirectResponse(res, `/hub/orders/${orderId}?success=Order status updated`);
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
    jsonResponse(res, 200, { success: true, message: 'Order cancelled' });
  } else {
    redirectResponse(res, `/hub/orders/${orderId}?success=Order cancelled`);
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
    jsonResponse(res, 200, { success: true, message: 'Refund processed' });
  } else {
    redirectResponse(res, `/hub/orders/${orderId}?success=Refund processed successfully`);
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
    redirectResponse(res, `/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to add note');
    redirectResponse(res, `/admin/orders/${req.params.orderId}`);
  }
};

export const deleteOrderNote = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { orderId, noteId } = req.params;
    await manageOrderNotesUseCase.softDelete(noteId);
    req.flash?.('success', 'Note deleted');
    redirectResponse(res, `/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to delete note');
    redirectResponse(res, `/admin/orders/${req.params.orderId}`);
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

    const command = new TrackFulfillmentPackageCommand({
      orderFulfillmentId: '',
      packageNumber: '',
      trackingNumber: trackingNumber || undefined,
      shippingLabelUrl: shippingLabelUrl || undefined,
      commercialInvoiceUrl: commercialInvoiceUrl || undefined,
      orderFulfillmentPackageId: packageId,
    });
    await trackFulfillmentPackageUseCase.execute(command);

    req.flash?.('success', 'Tracking updated');
    redirectResponse(res, `/admin/orders/${orderId}`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    req.flash?.('error', (error as Error).message || 'Failed to update tracking');
    redirectResponse(res, `/admin/orders/${req.params.orderId}`);
  }
};
