/**
 * Analytics Business Controller
 * Handles admin/merchant analytics and reporting operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageAnalyticsReportingUseCase } from '../../application/wired';


type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

// ============================================================================
// Sales Analytics
// ============================================================================

export const getSalesDashboard: AsyncHandler = async (req, res, _next) => {
  const { startDate, endDate, organizationId } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const [summary, dailyData, realTime] = await Promise.all([
    manageAnalyticsReportingUseCase.getSalesSummary(start, end, organizationId as string),
    manageAnalyticsReportingUseCase.getSalesDaily({ startDate: start, endDate: end, organizationId: organizationId as string }),
    manageAnalyticsReportingUseCase.getRealTimeMetrics(organizationId as string, 60),
  ]);

  res.json({
    success: true,
    data: {
      summary,
      daily: dailyData.data,
      realTime,
    },
  });
};

export const getSalesDaily: AsyncHandler = async (req, res, _next) => {
  const { startDate, endDate, channel, organizationId, limit, offset } = req.query;

  const result = await manageAnalyticsReportingUseCase.getSalesDaily(
    {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      channel: channel as string,
      organizationId: organizationId as string,
    },
    { limit: parseInt(limit as string) || 30, offset: parseInt(offset as string) || 0 },
  );

  res.json({ success: true, ...result });
};

// ============================================================================
// Product Analytics
// ============================================================================

export const getProductPerformance: AsyncHandler = async (req, res, _next) => {
  const { productId, startDate, endDate, limit, offset } = req.query;

  const result = await manageAnalyticsReportingUseCase.getProductPerformance(
    {
      productId: productId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    },
    { limit: parseInt(limit as string) || 30, offset: parseInt(offset as string) || 0 },
  );

  res.json({ success: true, ...result });
};

export const getTopProducts: AsyncHandler = async (req, res, _next) => {
  const { startDate, endDate, metric, limit } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const products = await manageAnalyticsReportingUseCase.getTopProducts(
    start,
    end,
    (metric as 'revenue' | 'purchases' | 'views') || 'revenue',
    parseInt(limit as string) || 10,
  );

  res.json({ success: true, data: products });
};

// ============================================================================
// Search Analytics
// ============================================================================

export const getSearchAnalytics: AsyncHandler = async (req, res, _next) => {
  const { startDate, endDate, isZeroResult, query, limit, offset } = req.query;

  const result = await manageAnalyticsReportingUseCase.getSearchQueries(
    {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      isZeroResult: isZeroResult === 'true' ? true : isZeroResult === 'false' ? false : undefined,
      query: query as string,
    },
    { limit: parseInt(limit as string) || 50, offset: parseInt(offset as string) || 0 },
  );

  res.json({ success: true, ...result });
};

export const getZeroResultSearches: AsyncHandler = async (req, res, _next) => {
  const { startDate, endDate, limit } = req.query;

  const result = await manageAnalyticsReportingUseCase.getSearchQueries(
    {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
      isZeroResult: true,
    },
    { limit: parseInt(limit as string) || 50, offset: 0 },
  );

  res.json({ success: true, data: result.data });
};

// ============================================================================
// Customer Analytics
// ============================================================================

export const getCustomerCohorts: AsyncHandler = async (req, res, _next) => {
  const { startMonth, endMonth } = req.query;

  const cohorts = await manageAnalyticsReportingUseCase.getCustomerCohorts(
    startMonth ? new Date(startMonth as string) : undefined,
    endMonth ? new Date(endMonth as string) : undefined,
  );

  res.json({ success: true, data: cohorts });
};

// ============================================================================
// Event Tracking
// ============================================================================

export const getEvents: AsyncHandler = async (req, res, _next) => {
  const { eventType, eventCategory, customerId, orderId, productId, startDate, endDate, limit, offset } = req.query;

  const result = await manageAnalyticsReportingUseCase.getEvents(
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
};

export const getEventCounts: AsyncHandler = async (req, res, _next) => {
  const { startDate, endDate, groupBy } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const counts = await manageAnalyticsReportingUseCase.getEventCounts(start, end, (groupBy as 'hour' | 'day') || 'hour');

  res.json({ success: true, data: counts });
};

// ============================================================================
// Snapshots
// ============================================================================

export const getSnapshots: AsyncHandler = async (req, res, _next) => {
  const { snapshotType, startDate, endDate, organizationId } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const snapshots = await manageAnalyticsReportingUseCase.getSnapshots(
    (snapshotType as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
    start,
    end,
    organizationId as string,
  );

  res.json({ success: true, data: snapshots });
};

export const getLatestSnapshot: AsyncHandler = async (req, res, _next) => {
  const { snapshotType, organizationId } = req.query;

  const snapshot = await manageAnalyticsReportingUseCase.getLatestSnapshot(
    (snapshotType as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
    organizationId as string,
  );

  res.json({ success: true, data: snapshot });
};

// ============================================================================
// Real-time Metrics
// ============================================================================

export const getRealTimeMetrics: AsyncHandler = async (req, res, _next) => {
  const { organizationId, minutes } = req.query;

  const metrics = await manageAnalyticsReportingUseCase.getRealTimeMetrics(organizationId as string, parseInt(minutes as string) || 60);

  res.json({ success: true, data: metrics });
};

// ============================================================================
// Dashboards
// ============================================================================

export const getDashboards: AsyncHandler = async (req, res, _next) => {
  const organizationId = req.user?.organizationId || req.user?.id;
  const dashboards = await manageAnalyticsReportingUseCase.getDashboards(organizationId);
  res.json({ success: true, data: dashboards });
};

export const getDashboard: AsyncHandler = async (req, res, _next) => {
  const dashboard = await manageAnalyticsReportingUseCase.getDashboard(req.params.id);
  if (!dashboard) {
    res.status(404).json({ success: false, message: 'Dashboard not found' });
    return;
  }
  res.json({ success: true, data: dashboard });
};

export const createDashboard: AsyncHandler = async (req, res, _next) => {
  const organizationId = req.user?.organizationId || req.user?.id;
  const createdBy = req.user?.userId;

  const body = req.body as Record<string, unknown>;
  const dashboard = await manageAnalyticsReportingUseCase.saveDashboard({
    ...body,
    name: (body.name as string) || 'Untitled',
    organizationId,
    createdBy,
  });

  res.status(201).json({ success: true, data: dashboard });
};

export const updateDashboard: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Record<string, unknown>;
  const dashboard = await manageAnalyticsReportingUseCase.saveDashboard({
    analyticsReportDashboardId: req.params.id,
    ...body,
    name: (body.name as string) || 'Untitled',
  });

  res.json({ success: true, data: dashboard });
};

export const deleteDashboard: AsyncHandler = async (req, res, _next) => {
  await manageAnalyticsReportingUseCase.deleteDashboard(req.params.id);
  res.json({ success: true, message: 'Dashboard deleted' });
};
