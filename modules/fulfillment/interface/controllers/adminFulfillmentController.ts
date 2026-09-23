/**
 * Fulfillment Controller
 * Handles order fulfillment tracking and warehouse operations
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageOrderFulfillmentsUseCase, getOrderForFulfillmentUseCase } from '../../../order/application/useCases/wired';
import { manageWarehouseAdminUseCase } from '../../../warehouse/application/wired';
import { adminRespond } from '../../../../libs/adminRespond';

const manageWarehouseUseCase = manageWarehouseAdminUseCase;

// ============================================================================
// Fulfillment Tracking & Management
// ============================================================================

export const listFulfillments = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const status = req.query.status as string;
  const warehouseId = req.query.warehouseId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  let fulfillments: unknown[];

  if (status) {
    fulfillments = await manageOrderFulfillmentsUseCase.findByStatus(status, limit, offset);
  } else {
    // Get recent fulfillments (this would need to be implemented in the repo)
    // For now, get pending fulfillments
    fulfillments = await manageOrderFulfillmentsUseCase.findByStatus('pending', limit, offset);
  }

  // Get fulfillment statistics
  const stats = await manageOrderFulfillmentsUseCase.getStatusStatistics();

  // Get warehouses for filtering
  const warehouses = await manageWarehouseUseCase.findAll(true);

  adminRespond(req, res, 'operations/fulfillments/index', {
    pageName: 'Order Fulfillments',
    fulfillments,
    stats,
    filters: { status, warehouseId },
    warehouses,
    pagination: { limit, offset },

    success: req.query.success || null,
  });
};

export const viewFulfillment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { fulfillmentId } = req.params;

  const fulfillment = await manageOrderFulfillmentsUseCase.findById(fulfillmentId);

  if (!fulfillment) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Fulfillment not found',
    });
    return;
  }

  // Get associated order details
  const order = await getOrderForFulfillmentUseCase.findById(fulfillment.orderId);

  adminRespond(req, res, 'operations/fulfillments/view', {
    pageName: `Fulfillment: ${fulfillment.fulfillmentNumber}`,
    fulfillment,
    order,

    success: req.query.success || null,
  });
};

export const updateFulfillmentStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { fulfillmentId } = req.params;
  const body = req.body as HttpRequestBody;
  const { status, trackingNumber, carrierCode, carrierName, trackingUrl, notes } = body as {
    status: string;
    trackingNumber?: string;
    carrierCode?: string;
    carrierName?: string;
    trackingUrl?: string;
    notes?: string;
  };

  // Update fulfillment status
  const fulfillment = await manageOrderFulfillmentsUseCase.updateStatus(fulfillmentId, status);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  // Add tracking info if provided
  if (trackingNumber && status === 'shipped') {
    await manageOrderFulfillmentsUseCase.addTracking(fulfillmentId, trackingNumber, carrierCode, carrierName, trackingUrl);
  }

  // Update notes if provided
  if (notes) {
    await manageOrderFulfillmentsUseCase.update(fulfillmentId, { notes });
  }

  res.json({
    success: true,
    message: `Fulfillment status updated to ${status}`,
    fulfillment,
  });
};

export const markAsShipped = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { fulfillmentId } = req.params;
  const body = req.body as HttpRequestBody;
  const { trackingNumber, carrierCode, carrierName, trackingUrl } = body as {
    trackingNumber?: string;
    carrierCode?: string;
    carrierName?: string;
    trackingUrl?: string;
  };

  // Mark as shipped
  const fulfillment = await manageOrderFulfillmentsUseCase.markAsShipped(fulfillmentId);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  // Add tracking info
  if (trackingNumber) {
    await manageOrderFulfillmentsUseCase.addTracking(fulfillmentId, trackingNumber, carrierCode, carrierName, trackingUrl);
  }

  res.json({
    success: true,
    message: 'Fulfillment marked as shipped',
    fulfillment,
  });
};

export const markAsDelivered = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { fulfillmentId } = req.params;

  const fulfillment = await manageOrderFulfillmentsUseCase.markAsDelivered(fulfillmentId);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  res.json({
    success: true,
    message: 'Fulfillment marked as delivered',
    fulfillment,
  });
};

export const cancelFulfillment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { fulfillmentId } = req.params;
  const body = req.body as HttpRequestBody;
  const { notes } = body as { notes?: string };

  const fulfillment = await manageOrderFulfillmentsUseCase.cancel(fulfillmentId, notes);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  res.json({
    success: true,
    message: 'Fulfillment cancelled',
    fulfillment,
  });
};

export const getFulfillmentStats = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stats = await manageOrderFulfillmentsUseCase.getStatusStatistics();
  const overdue = await manageOrderFulfillmentsUseCase.findOverdue();
  const shippedToday = await manageOrderFulfillmentsUseCase.findShippedToday();

  res.json({
    success: true,
    stats,
    overdueCount: overdue.length,
    shippedTodayCount: shippedToday.length,
  });
};

// ============================================================================
// Warehouse Operations Dashboard
// ============================================================================

export const warehouseDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const warehouseId = req.query.warehouseId as string;

  // Get warehouse stats
  const warehouseStats = await manageWarehouseUseCase.getStatistics();

  // Get fulfillment stats
  const fulfillmentStats = await manageOrderFulfillmentsUseCase.getStatusStatistics();

  // Get overdue fulfillments
  const overdueFulfillments = await manageOrderFulfillmentsUseCase.findOverdue();

  // Get recent shipments
  const recentShipments = await manageOrderFulfillmentsUseCase.findShippedToday();

  // Get pending fulfillments
  const pendingFulfillments = await manageOrderFulfillmentsUseCase.findByStatus('pending', 10);

  adminRespond(req, res, 'operations/dashboard', {
    pageName: 'Warehouse Operations',
    warehouseStats,
    fulfillmentStats,
    overdueFulfillments,
    recentShipments,
    pendingFulfillments,
    selectedWarehouse: warehouseId,
  });
};
