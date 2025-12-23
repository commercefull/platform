/**
 * Analytics Business Controller
 * Handles admin/merchant analytics and reporting operations
 */

import { logger } from '../../../libs/logger';
import { Request, Response, NextFunction } from 'express';
import * as analyticsRepo from '../repos/analyticsRepo';
import * as reportingRepo from '../repos/reportingRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Sales Analytics
// ============================================================================

export const getSalesDashboard: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate, merchantId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [summary, dailyData, realTime] = await Promise.all([
      analyticsRepo.getSalesSummary(start, end, merchantId as string),
      analyticsRepo.getSalesDaily({ startDate: start, endDate: end, merchantId: merchantId as string }),
      reportingRepo.getRealTimeMetrics(merchantId as string, 60),
    ]);

    res.json({
      success: true,
      data: {
        summary,
        daily: dailyData.data,
        realTime,
      },
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesDaily: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate, channel, merchantId, limit, offset } = req.query;

    const result = await analyticsRepo.getSalesDaily(
      {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        channel: channel as string,
        merchantId: merchantId as string,
      },
      { limit: parseInt(limit as string) || 30, offset: parseInt(offset as string) || 0 },
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Product Analytics
// ============================================================================

export const getProductPerformance: AsyncHandler = async (req, res, next) => {
  try {
    const { productId, startDate, endDate, limit, offset } = req.query;

    const result = await analyticsRepo.getProductPerformance(
      {
        productId: productId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
      { limit: parseInt(limit as string) || 30, offset: parseInt(offset as string) || 0 },
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopProducts: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate, metric, limit } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const products = await analyticsRepo.getTopProducts(
      start,
      end,
      (metric as 'revenue' | 'purchases' | 'views') || 'revenue',
      parseInt(limit as string) || 10,
    );

    res.json({ success: true, data: products });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Search Analytics
// ============================================================================

export const getSearchAnalytics: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate, isZeroResult, query, limit, offset } = req.query;

    const result = await analyticsRepo.getSearchQueries(
      {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        isZeroResult: isZeroResult === 'true' ? true : isZeroResult === 'false' ? false : undefined,
        query: query as string,
      },
      { limit: parseInt(limit as string) || 50, offset: parseInt(offset as string) || 0 },
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getZeroResultSearches: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;

    const result = await analyticsRepo.getSearchQueries(
      {
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate as string) : new Date(),
        isZeroResult: true,
      },
      { limit: parseInt(limit as string) || 50, offset: 0 },
    );

    res.json({ success: true, data: result.data });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Customer Analytics
// ============================================================================

export const getCustomerCohorts: AsyncHandler = async (req, res, next) => {
  try {
    const { startMonth, endMonth } = req.query;

    const cohorts = await analyticsRepo.getCustomerCohorts(
      startMonth ? new Date(startMonth as string) : undefined,
      endMonth ? new Date(endMonth as string) : undefined,
    );

    res.json({ success: true, data: cohorts });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Event Tracking
// ============================================================================

export const getEvents: AsyncHandler = async (req, res, next) => {
  try {
    const { eventType, eventCategory, customerId, orderId, productId, startDate, endDate, limit, offset } = req.query;

    const result = await reportingRepo.getEvents(
      {
        eventType: eventType as string,
        eventCategory: eventCategory as string,
        customerId: customerId as string,
        orderId: orderId as string,
        productId: productId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
      { limit: parseInt(limit as string) || 100, offset: parseInt(offset as string) || 0 },
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventCounts: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const counts = await reportingRepo.getEventCounts(start, end, (groupBy as 'hour' | 'day') || 'hour');

    res.json({ success: true, data: counts });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Snapshots
// ============================================================================

export const getSnapshots: AsyncHandler = async (req, res, next) => {
  try {
    const { snapshotType, startDate, endDate, merchantId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const snapshots = await reportingRepo.getSnapshots(
      (snapshotType as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
      start,
      end,
      merchantId as string,
    );

    res.json({ success: true, data: snapshots });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLatestSnapshot: AsyncHandler = async (req, res, next) => {
  try {
    const { snapshotType, merchantId } = req.query;

    const snapshot = await reportingRepo.getLatestSnapshot(
      (snapshotType as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
      merchantId as string,
    );

    res.json({ success: true, data: snapshot });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Real-time Metrics
// ============================================================================

export const getRealTimeMetrics: AsyncHandler = async (req, res, next) => {
  try {
    const { merchantId, minutes } = req.query;

    const metrics = await reportingRepo.getRealTimeMetrics(merchantId as string, parseInt(minutes as string) || 60);

    res.json({ success: true, data: metrics });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Dashboards
// ============================================================================

export const getDashboards: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const dashboards = await reportingRepo.getDashboards(merchantId);
    res.json({ success: true, data: dashboards });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboard: AsyncHandler = async (req, res, next) => {
  try {
    const dashboard = await reportingRepo.getDashboard(req.params.id);
    if (!dashboard) {
      res.status(404).json({ success: false, message: 'Dashboard not found' });
      return;
    }
    res.json({ success: true, data: dashboard });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDashboard: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const createdBy = (req as any).userId;

    const dashboard = await reportingRepo.saveDashboard({
      ...req.body,
      merchantId,
      createdBy,
    });

    res.status(201).json({ success: true, data: dashboard });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDashboard: AsyncHandler = async (req, res, next) => {
  try {
    const dashboard = await reportingRepo.saveDashboard({
      analyticsReportDashboardId: req.params.id,
      ...req.body,
    });

    res.json({ success: true, data: dashboard });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDashboard: AsyncHandler = async (req, res, next) => {
  try {
    await reportingRepo.deleteDashboard(req.params.id);
    res.json({ success: true, message: 'Dashboard deleted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};
