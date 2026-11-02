/**
 * Order Business Operations Controllers
 *
 * Notes, refunds, fulfillment packages, items, and status history.
 * Split from OrderBusinessController.ts; re-exported there for router compatibility.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { GetOrderCommand } from '../../application/useCases/GetOrder';
import { AddOrderNoteCommand } from '../../application/useCases/AddOrderNote';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import { CreateOrderRefundCommand } from '../../application/useCases/CreateOrderRefund';
import { TrackFulfillmentPackageCommand } from '../../application/useCases/TrackFulfillmentPackage';
import { UpdatePaymentStatusCommand } from '../../application/useCases/UpdatePaymentStatus';
import { UpdateFulfillmentStatusCommand } from '../../application/useCases/UpdateFulfillmentStatus';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import {
  getOrderUseCase,
  updatePaymentStatusUseCase,
  updateFulfillmentStatusUseCase,
  addOrderNoteUseCase,
  createOrderRefundUseCase,
  trackFulfillmentPackageUseCase,
  manageOrderNotesUseCase,
  getOrderRefundsUseCase,
  getFulfillmentPackagesUseCase,
  manageOrderItemsUseCase,
  getOrderHistoryUseCase,
} from '../../application/useCases/wired';
import { respond, respondError } from './orderControllerRespond';

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

  const command = new CreateOrderRefundCommand({
    orderPaymentId: orderPaymentId,
    amountCents: Math.round(parseFloat(amount) * 100),
    reason: reason,
    notes: notes,
    transactionId: transactionId,
    refundedBy: req.user?.userId,
  });
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

  const command = new TrackFulfillmentPackageCommand({
    orderFulfillmentId: orderFulfillmentId,
    packageNumber: packageNumber,
    trackingNumber: trackingNumber,
    shippingLabelUrl: shippingLabelUrl,
    commercialInvoiceUrl: commercialInvoiceUrl,
    weight: weight ? parseFloat(weight) : undefined,
    dimensions: dimensions,
    packageType: packageType,
    customsInfo: customsInfo,
  });
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

  const command = new TrackFulfillmentPackageCommand({
    orderFulfillmentId: orderFulfillmentId || '',
    packageNumber: packageNumber || '',
    trackingNumber: trackingNumber,
    shippingLabelUrl: shippingLabelUrl,
    commercialInvoiceUrl: commercialInvoiceUrl,
    orderFulfillmentPackageId: packageId,
  });
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
    const result = await updatePaymentStatusUseCase.execute(new UpdatePaymentStatusCommand(orderId, paymentStatus as PaymentStatus));
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
