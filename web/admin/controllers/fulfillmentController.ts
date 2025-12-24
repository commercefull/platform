/**
 * Fulfillment Controller
 * Handles order fulfillment tracking and warehouse operations
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import orderFulfillmentRepo from '../../../modules/order/repos/orderFulfillmentRepo';
import orderRepo from '../../../modules/order/repos/orderRepo';
import warehouseRepo from '../../../modules/warehouse/repos/warehouseRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Fulfillment Tracking & Management
// ============================================================================

export const listFulfillments = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const warehouseId = req.query.warehouseId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let fulfillments: any[] = [];

    if (status) {
      fulfillments = await orderFulfillmentRepo.findByStatus(status as any, limit, offset);
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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load fulfillments',
    });
  }
};

export const viewFulfillment = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load fulfillment',
    });
  }
};

export const updateFulfillmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;
    const { status, trackingNumber, carrierCode, carrierName, trackingUrl, notes } = req.body;

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
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to update fulfillment status' });
  }
};

export const markAsShipped = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;
    const { trackingNumber, carrierCode, carrierName, trackingUrl } = req.body;

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
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to mark as shipped' });
  }
};

export const markAsDelivered = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to mark as delivered' });
  }
};

export const cancelFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fulfillmentId } = req.params;
    const { notes } = req.body;

    const fulfillment = await orderFulfillmentRepo.cancel(fulfillmentId, notes);

    if (!fulfillment) {
      throw new Error('Fulfillment not found');
    }

    res.json({
      success: true,
      message: 'Fulfillment cancelled',
      fulfillment,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to cancel fulfillment' });
  }
};

export const getFulfillmentStats = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to get fulfillment stats' });
  }
};

// ============================================================================
// Warehouse Operations Dashboard
// ============================================================================

export const warehouseDashboard = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load warehouse dashboard',
    });
  }
};
