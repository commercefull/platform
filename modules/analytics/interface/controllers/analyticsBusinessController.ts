/**
 * Analytics Business Controller
 * Handles admin/merchant analytics and reporting operations
 */

import { logger } from '../../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as analyticsRepo from '../../infrastructure/repositories/analyticsRepo';
import * as reportingRepo from '../../infrastructure/repositories/reportingRepo';

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

// ============================================================================
// Sales Analytics
// ============================================================================

export const getSalesDashboard: AsyncHandler = async (req, res, _next) => {
  try {
    const { startDate, endDate, organizationId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [summary, dailyData, realTime] = await Promise.all([
      analyticsRepo.getSalesSummary(start, end, organizationId as string),
      analyticsRepo.getSalesDaily({ startDate: start, endDate: end, organizationId: organizationId as string }),
      reportingRepo.getRealTimeMetrics(organizationId as string, 60),
    ]);

    res.json({
      success: true,
      data: {
        summary,
        daily: dailyData.data,
        realTime,
      },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getSalesDaily: AsyncHandler = async (req, res, _next) => {
  try {
    const { startDate, endDate, channel, organizationId, limit, offset } = req.query;

    const result = await analyticsRepo.getSalesDaily(
      {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        channel: channel as string,
        organizationId: organizationId as string,
      },
      { limit: parseInt(limit as string) || 30, offset: parseInt(offset as string) || 0 },
    );

    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Product Analytics
// ============================================================================

export const getProductPerformance: AsyncHandler = async (req, res, _next) => {
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getTopProducts: AsyncHandler = async (req, res, _next) => {
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Search Analytics
// ============================================================================

export const getSearchAnalytics: AsyncHandler = async (req, res, _next) => {
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getZeroResultSearches: AsyncHandler = async (req, res, _next) => {
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Customer Analytics
// ============================================================================

export const getCustomerCohorts: AsyncHandler = async (req, res, _next) => {
  try {
    const { startMonth, endMonth } = req.query;

    const cohorts = await analyticsRepo.getCustomerCohorts(
      startMonth ? new Date(startMonth as string) : undefined,
      endMonth ? new Date(endMonth as string) : undefined,
    );

    res.json({ success: true, data: cohorts });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Event Tracking
// ============================================================================

export const getEvents: AsyncHandler = async (req, res, _next) => {
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
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getEventCounts: AsyncHandler = async (req, res, _next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const counts = await reportingRepo.getEventCounts(start, end, (groupBy as 'hour' | 'day') || 'hour');

    res.json({ success: true, data: counts });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Snapshots
// ============================================================================

export const getSnapshots: AsyncHandler = async (req, res, _next) => {
  try {
    const { snapshotType, startDate, endDate, organizationId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const snapshots = await reportingRepo.getSnapshots(
      (snapshotType as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
      start,
      end,
      organizationId as string,
    );

    res.json({ success: true, data: snapshots });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getLatestSnapshot: AsyncHandler = async (req, res, _next) => {
  try {
    const { snapshotType, organizationId } = req.query;

    const snapshot = await reportingRepo.getLatestSnapshot(
      (snapshotType as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
      organizationId as string,
    );

    res.json({ success: true, data: snapshot });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Real-time Metrics
// ============================================================================

export const getRealTimeMetrics: AsyncHandler = async (req, res, _next) => {
  try {
    const { organizationId, minutes } = req.query;

    const metrics = await reportingRepo.getRealTimeMetrics(organizationId as string, parseInt(minutes as string) || 60);

    res.json({ success: true, data: metrics });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Dashboards
// ============================================================================

export const getDashboards: AsyncHandler = async (req, res, _next) => {
  try {
    const organizationId = req.user?.organizationId || req.user?.id;
    const dashboards = await reportingRepo.getDashboards(organizationId);
    res.json({ success: true, data: dashboards });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getDashboard: AsyncHandler = async (req, res, _next) => {
  try {
    const dashboard = await reportingRepo.getDashboard(req.params.id);
    if (!dashboard) {
      res.status(404).json({ success: false, message: 'Dashboard not found' });
      return;
    }
    res.json({ success: true, data: dashboard });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createDashboard: AsyncHandler = async (req, res, _next) => {
  try {
    const organizationId = req.user?.organizationId || req.user?.id;
    const createdBy = req.user?.userId;

    const body = req.body as Record<string, unknown>;
    const dashboard = await reportingRepo.saveDashboard({
      ...body,
      name: (body.name as string) || 'Untitled',
      organizationId,
      createdBy,
    });

    res.status(201).json({ success: true, data: dashboard });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateDashboard: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const dashboard = await reportingRepo.saveDashboard({
      analyticsReportDashboardId: req.params.id,
      ...body,
      name: (body.name as string) || 'Untitled',
    });

    res.json({ success: true, data: dashboard });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteDashboard: AsyncHandler = async (req, res, _next) => {
  try {
    await reportingRepo.deleteDashboard(req.params.id);
    res.json({ success: true, message: 'Dashboard deleted' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
