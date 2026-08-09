/**
 * Fulfillment Controller
 * Handles order fulfillment tracking and warehouse operations
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import orderFulfillmentRepo from '../../../modules/order/infrastructure/repositories/orderFulfillmentRepo';
import orderRepo from '../../../modules/order/infrastructure/repositories/orderRepo';
import warehouseRepo from '../../../modules/warehouse/infrastructure/repositories/warehouseRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Fulfillment Tracking & Management
// ============================================================================

export const listFulfillments = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const warehouseId = req.query.warehouseId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let fulfillments: unknown[] = [];

    if (status) {
      fulfillments = await orderFulfillmentRepo.findByStatus(status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed' | 'cancelled', limit, offset);
    } else {
      // Get recent fulfillments (this would need to be implemented in the repo)
      // For now, get pending fulfillments
      fulfillments = await orderFulfillmentRepo.findByStatus('pending', limit, offset);
    }

    // Get fulfillment statistics
    const stats = await orderFulfillmentRepo.getStatusStatistics();

    // Get warehouses for filtering
    const warehouses = await warehouseRepo.findAll(true);

    adminRespond(req, res, 'operations/fulfillments/index', {
      pageName: 'Order Fulfillments',
      fulfillments,
      stats,
      filters: { status, warehouseId },
      warehouses,
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load fulfillments',
    });
  }
};

export const viewFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;

    const fulfillment = await orderFulfillmentRepo.findById(fulfillmentId);

    if (!fulfillment) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Fulfillment not found',
      });
      return;
    }

    // Get associated order details
    const order = await orderRepo.findById(fulfillment.orderId);

    adminRespond(req, res, 'operations/fulfillments/view', {
      pageName: `Fulfillment: ${fulfillment.fulfillmentNumber}`,
      fulfillment,
      order,

      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load fulfillment',
    });
  }
};

export const updateFulfillmentStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;
    const body = req.body as RequestBody;
    const { status, trackingNumber, carrierCode, carrierName, trackingUrl, notes } = body;

    // Update fulfillment status
    const fulfillment = await orderFulfillmentRepo.updateStatus(fulfillmentId, status);

    if (!fulfillment) {
      throw new Error('Fulfillment not found');
    }

    // Add tracking info if provided
    if (trackingNumber && status === 'shipped') {
      await orderFulfillmentRepo.addTracking(fulfillmentId, trackingNumber, carrierCode, carrierName, trackingUrl);
    }

    // Update notes if provided
    if (notes) {
      await orderFulfillmentRepo.update(fulfillmentId, { notes });
    }

    res.json({
      success: true,
      message: `Fulfillment status updated to ${status}`,
      fulfillment,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to update fulfillment status' });
  }
};

export const markAsShipped = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;
    const body = req.body as RequestBody;
    const { trackingNumber, carrierCode, carrierName, trackingUrl } = body;

    // Mark as shipped
    const fulfillment = await orderFulfillmentRepo.markAsShipped(fulfillmentId);

    if (!fulfillment) {
      throw new Error('Fulfillment not found');
    }

    // Add tracking info
    if (trackingNumber) {
      await orderFulfillmentRepo.addTracking(fulfillmentId, trackingNumber, carrierCode, carrierName, trackingUrl);
    }

    res.json({
      success: true,
      message: 'Fulfillment marked as shipped',
      fulfillment,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to mark as shipped' });
  }
};

export const markAsDelivered = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;

    const fulfillment = await orderFulfillmentRepo.markAsDelivered(fulfillmentId);

    if (!fulfillment) {
      throw new Error('Fulfillment not found');
    }

    res.json({
      success: true,
      message: 'Fulfillment marked as delivered',
      fulfillment,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to mark as delivered' });
  }
};

export const cancelFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;
    const body = req.body as RequestBody;
    const { notes } = body;

    const fulfillment = await orderFulfillmentRepo.cancel(fulfillmentId, notes);

    if (!fulfillment) {
      throw new Error('Fulfillment not found');
    }

    res.json({
      success: true,
      message: 'Fulfillment cancelled',
      fulfillment,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to cancel fulfillment' });
  }
};

export const getFulfillmentStats = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stats = await orderFulfillmentRepo.getStatusStatistics();
    const overdue = await orderFulfillmentRepo.findOverdue();
    const shippedToday = await orderFulfillmentRepo.findShippedToday();

    res.json({
      success: true,
      stats,
      overdueCount: overdue.length,
      shippedTodayCount: shippedToday.length,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to get fulfillment stats' });
  }
};

// ============================================================================
// Warehouse Operations Dashboard
// ============================================================================

export const warehouseDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const warehouseId = req.query.warehouseId as string;

    // Get warehouse stats
    const warehouseStats = await warehouseRepo.getStatistics();

    // Get fulfillment stats
    const fulfillmentStats = await orderFulfillmentRepo.getStatusStatistics();

    // Get overdue fulfillments
    const overdueFulfillments = await orderFulfillmentRepo.findOverdue();

    // Get recent shipments
    const recentShipments = await orderFulfillmentRepo.findShippedToday();

    // Get pending fulfillments
    const pendingFulfillments = await orderFulfillmentRepo.findByStatus('pending', 10);

    adminRespond(req, res, 'operations/dashboard', {
      pageName: 'Warehouse Operations',
      warehouseStats,
      fulfillmentStats,
      overdueFulfillments,
      recentShipments,
      pendingFulfillments,
      selectedWarehouse: warehouseId,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load warehouse dashboard',
    });
  }
};
