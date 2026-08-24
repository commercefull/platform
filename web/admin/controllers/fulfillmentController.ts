/**
 * Fulfillment Controller
 * Handles order fulfillment tracking and warehouse operations
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageOrderFulfillmentsUseCase, GetOrderForFulfillmentUseCase } from '../../../modules/order/application/useCases/ManageOrderFulfillments';
import { ManageWarehouseAdminUseCase } from '../../../modules/warehouse/application/useCases/ManageWarehouseAdmin';
import { adminRespond } from '../../respond';

const manageFulfillmentsUseCase = new ManageOrderFulfillmentsUseCase();
const getOrderForFulfillmentUseCase = new GetOrderForFulfillmentUseCase();
const manageWarehouseUseCase = new ManageWarehouseAdminUseCase();

// ============================================================================
// Fulfillment Tracking & Management
// ============================================================================

export const listFulfillments = async (req: TypedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const warehouseId = req.query.warehouseId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  let fulfillments: unknown[];

  if (status) {
    fulfillments = await manageFulfillmentsUseCase.findByStatus(status, limit, offset);
  } else {
    // Get recent fulfillments (this would need to be implemented in the repo)
    // For now, get pending fulfillments
    fulfillments = await manageFulfillmentsUseCase.findByStatus('pending', limit, offset);
  }

  // Get fulfillment statistics
  const stats = await manageFulfillmentsUseCase.getStatusStatistics();

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

export const viewFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  const { fulfillmentId } = req.params;

  const fulfillment = await manageFulfillmentsUseCase.findById(fulfillmentId);

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

export const updateFulfillmentStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  const { fulfillmentId } = req.params;
  const body = req.body as RequestBody;
  const { status, trackingNumber, carrierCode, carrierName, trackingUrl, notes } = body;

  // Update fulfillment status
  const fulfillment = await manageFulfillmentsUseCase.updateStatus(fulfillmentId, status);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  // Add tracking info if provided
  if (trackingNumber && status === 'shipped') {
    await manageFulfillmentsUseCase.addTracking(fulfillmentId, trackingNumber, carrierCode, carrierName, trackingUrl);
  }

  // Update notes if provided
  if (notes) {
    await manageFulfillmentsUseCase.update(fulfillmentId, { notes });
  }

  res.json({
    success: true,
    message: `Fulfillment status updated to ${status}`,
    fulfillment,
  });
  
};

export const markAsShipped = async (req: TypedRequest, res: Response): Promise<void> => {
  const { fulfillmentId } = req.params;
  const body = req.body as RequestBody;
  const { trackingNumber, carrierCode, carrierName, trackingUrl } = body;

  // Mark as shipped
  const fulfillment = await manageFulfillmentsUseCase.markAsShipped(fulfillmentId);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  // Add tracking info
  if (trackingNumber) {
    await manageFulfillmentsUseCase.addTracking(fulfillmentId, trackingNumber, carrierCode, carrierName, trackingUrl);
  }

  res.json({
    success: true,
    message: 'Fulfillment marked as shipped',
    fulfillment,
  });
  
};

export const markAsDelivered = async (req: TypedRequest, res: Response): Promise<void> => {
  const { fulfillmentId } = req.params;

  const fulfillment = await manageFulfillmentsUseCase.markAsDelivered(fulfillmentId);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  res.json({
    success: true,
    message: 'Fulfillment marked as delivered',
    fulfillment,
  });
  
};

export const cancelFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  const { fulfillmentId } = req.params;
  const body = req.body as RequestBody;
  const { notes } = body;

  const fulfillment = await manageFulfillmentsUseCase.cancel(fulfillmentId, notes);

  if (!fulfillment) {
    throw new Error('Fulfillment not found');
  }

  res.json({
    success: true,
    message: 'Fulfillment cancelled',
    fulfillment,
  });
  
};

export const getFulfillmentStats = async (req: TypedRequest, res: Response): Promise<void> => {
  const stats = await manageFulfillmentsUseCase.getStatusStatistics();
  const overdue = await manageFulfillmentsUseCase.findOverdue();
  const shippedToday = await manageFulfillmentsUseCase.findShippedToday();

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

export const warehouseDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  const warehouseId = req.query.warehouseId as string;

  // Get warehouse stats
  const warehouseStats = await manageWarehouseUseCase.getStatistics();

  // Get fulfillment stats
  const fulfillmentStats = await manageFulfillmentsUseCase.getStatusStatistics();

  // Get overdue fulfillments
  const overdueFulfillments = await manageFulfillmentsUseCase.findOverdue();

  // Get recent shipments
  const recentShipments = await manageFulfillmentsUseCase.findShippedToday();

  // Get pending fulfillments
  const pendingFulfillments = await manageFulfillmentsUseCase.findByStatus('pending', 10);

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
