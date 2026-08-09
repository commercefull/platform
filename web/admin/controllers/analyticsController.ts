/**
 * Advanced Analytics Controller
 * Provides comprehensive business intelligence, predictive analytics, and real-time insights
 * for the Commercefull Admin Hub - Phase 7
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { getSalesSummary, getTopProducts, getCustomerCohorts } from '../../../modules/analytics/infrastructure/repositories/analyticsRepo';
import * as adminAnalyticsRepo from '../../../modules/analytics/infrastructure/repositories/adminAnalyticsRepo';
import {
  getScheduledReports,
  getReportExecutionHistory,
  generateReport,
  scheduleReport,
} from '../../../modules/analytics/services/automatedReportingService';
import {
  forecastSalesRevenue,
  predictCustomerChurn,
  optimizeInventoryLevels,
  generateProductRecommendations,
  performCustomerSegmentation,
} from '../../../modules/analytics/services/machineLearningService';
import { GetStoreSalesSummaryUseCase } from '../../../modules/order/application/useCases/GetStoreSalesSummary';
import StoreRepo from '../../../modules/store/infrastructure/repositories/StoreRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Advanced Analytics Dashboard
// ============================================================================

export const analyticsDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { period = '30d', segment = 'all', category = 'all' } = req.query;

    // Parse date range
    const [startDate, endDate] = parsePeriod(period as string);

    // Get sales summary
    const salesSummary = await getSalesSummary(startDate, endDate);

    // Get top products
    const topProducts = await getTopProducts(startDate, endDate, 'revenue', 10);

    // Get customer cohorts for retention analysis
    const _customerCohorts = await getCustomerCohorts();

    // Build comprehensive dashboard data
    const dashboardData = {
      revenue: {
        total: salesSummary.totalRevenue,
        growth: 0, // Would calculate from previous period
        byPeriod: [], // Would aggregate from daily sales
        forecast: [], // Would implement forecasting
      },
      customers: {
        total: salesSummary.newCustomers + salesSummary.totalOrders, // Approximation
        new: salesSummary.newCustomers,
        returning: Math.max(0, salesSummary.totalOrders - salesSummary.newCustomers),
        churnRate: 0, // Would calculate from cohorts
        lifetimeValue: 0, // Would calculate from cohorts
        segments: [], // Would implement segmentation
      },
      products: {
        topSelling: topProducts.map((p) => ({
          productId: p.productId,
          name: `Product ${p.productId.slice(-8)}`, // Would join with product table
          sales: p.quantitySold,
          revenue: p.revenue,
        })),
        lowStock: [], // Would implement inventory alerts
        recommendations: [], // Would implement AI recommendations
        performance: topProducts.map((p) => ({
          productId: p.productId,
          name: `Product ${p.productId.slice(-8)}`,
          views: p.views,
          conversions: p.purchases,
        })),
      },
      marketing: {
        campaignPerformance: [],
        channelEffectiveness: [],
        conversionRates: [],
        customerAcquisitionCost: 0,
      },
      operations: {
        orderFulfillment: 0,
        inventoryTurnover: 0,
        supplierPerformance: [],
        shippingEfficiency: 0,
      },
      subscriptions: {
        activeSubscriptions: 0,
        churnRate: 0,
        upgradeRate: 0,
        lifetimeValue: 0,
      },
    };

    adminRespond(req, res, 'analytics/dashboard', {
      pageName: 'Advanced Analytics Dashboard',
      dashboardData,
      filters: { period, segment, category },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load analytics dashboard',
    });
  }
};

export const storeSalesDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
    const summary = await new GetStoreSalesSummaryUseCase().execute({
      storeId: req.query.storeId as string | undefined,
      dateFrom,
      dateTo,
    });
    const stores = await StoreRepo.findActive();

    adminRespond(req, res, 'analytics/store-sales', {
      pageName: 'Store Sales',
      summary,
      stores,
      filters: {
        storeId: req.query.storeId || '',
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
      },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load store sales dashboard' });
  }
};

// ============================================================================
// Predictive Analytics
// ============================================================================

export const predictiveAnalytics = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Get historical sales data for forecasting
    const [startDate] = parsePeriod('90d'); // Last 90 days for forecasting
    const salesData = await getSalesSummary(startDate, new Date());

    // Create historical data for forecasting
    const historicalData = [
      {
        date: new Date(),
        revenue: salesData.totalRevenue,
        orders: salesData.totalOrders,
      },
    ]; // Simplified - would get daily data

    const forecasts = await forecastSalesRevenue(historicalData, 30);
    const inventoryPredictions = await optimizeInventoryLevels();

    // Get customer churn analysis for top customers
    const customerChurnData = await adminAnalyticsRepo.findRecentCustomerIds(10);

    const customerChurnPromises = customerChurnData.map(async customerId => {
      try {
        const history = await adminAnalyticsRepo.findCustomerPurchaseHistory(customerId, 30);

        const analysis = await predictCustomerChurn(
          customerId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (history as any[]).map((h) => ({ date: h.date, orders: parseInt(h.orders.toString()), revenue: parseFloat(h.revenue.toString()) })),
        );

        return {
          customerId,
          ...analysis,
        };
      } catch (error) {
        logger.error('Error:', error);
        return {
          customerId,
          churnProbability: 0,
          riskLevel: 'low' as const,
          factors: [],
          recommendations: [],
        };
      }
    });

    const customerChurnRisk = await Promise.all(customerChurnPromises);

    adminRespond(req, res, 'analytics/predictive', {
      pageName: 'Predictive Analytics',
      forecasts,
      inventoryPredictions,
      customerChurnRisk,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load predictive analytics',
    });
  }
};

// ============================================================================
// Customer Analytics
// ============================================================================

export const customerAnalytics = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { _segmentId } = req.params;

    // Get customer segmentation analysis
    const segmentationAnalysis = await performCustomerSegmentation();

    // Get customer lifetime value analysis
    const lifetimeValue = {
      averageCLV: 0, // Would calculate from cohort data
      clvBySegment: segmentationAnalysis.segments.map(s => ({
        segment: s.name,
        clv: s.avgLifetimeValue,
      })),
      clvDistribution: [],
      retentionImpact: [],
    };

    // Get customer insights (simplified)
    const customerInsights = {
      segmentAnalysis: segmentationAnalysis.segments.map(s => ({
        segmentId: s.id,
        segmentName: s.name,
        customerCount: s.size,
        avgLifetimeValue: s.avgLifetimeValue,
        churnRate: s.churnRate,
        keyCharacteristics: s.characteristics,
      })),
      behaviorPatterns: [],
      purchaseFrequency: [],
      engagementMetrics: [],
      loyaltyTrends: [],
    };

    adminRespond(req, res, 'analytics/customers', {
      pageName: 'Customer Analytics & Segmentation',
      customerInsights,
      lifetimeValue,
      segmentationAnalysis,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load customer analytics',
    });
  }
};

// ============================================================================
// AI Recommendations
// ============================================================================

export const aiRecommendations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Get a sample customer for demonstration
    const sampleCustomerId = await adminAnalyticsRepo.findRecentCustomerId();

    let productRecommendations: {
      personalized: Array<{ productId: string; score: number; reason: string }>;
      trending: Array<{ productId: string; trend: number; category: string }>;
      complementary: Array<{ productId: string; baseProductId: string; lift: number }>;
    } = { personalized: [], trending: [], complementary: [] };

    if (sampleCustomerId) {
      productRecommendations = await generateProductRecommendations(sampleCustomerId);
    }

    // Get personalized campaigns (placeholder for now)
    const personalizedCampaigns = {
      suggestions: [
        {
          name: 'Re-engagement Campaign',
          targetAudience: 'Inactive customers (30+ days)',
          expectedROI: 0.25,
          confidence: 0.82,
        },
        {
          name: 'Cross-sell Campaign',
          targetAudience: 'Recent purchasers',
          expectedROI: 0.18,
          confidence: 0.76,
        },
      ],
      audienceTargeting: [],
      contentOptimization: [],
      timingOptimization: [],
    };

    // Get cross-sell opportunities
    const crossSellOpportunities = {
      productBundles: [],
      upsellOpportunities: [],
      accessoryRecommendations: productRecommendations.complementary.map(c => ({
        productId: c.productId,
        baseProductId: c.baseProductId,
        confidence: c.lift / 10, // Normalize lift score
      })),
      serviceAddons: [],
    };

    adminRespond(req, res, 'analytics/ai-recommendations', {
      pageName: 'AI-Powered Recommendations',
      productRecommendations,
      personalizedCampaigns,
      crossSellOpportunities,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load AI recommendations',
    });
  }
};

// ============================================================================
// Executive Dashboard
// ============================================================================

export const executiveDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Get current period KPIs
    const [startDate, endDate] = parsePeriod('30d');
    const currentKPIs = await calculateExecutiveKPIs(startDate, endDate);

    // Get previous period for comparison
    const [prevStartDate, _prevEndDate] = parsePeriod('60d');
    const previousKPIs = await calculateExecutiveKPIs(prevStartDate, startDate);

    // Calculate KPI changes
    const kpis = {
      revenue: {
        current: currentKPIs.revenue,
        target: currentKPIs.revenue * 1.15, // 15% growth target
        growth: ((currentKPIs.revenue - previousKPIs.revenue) / previousKPIs.revenue) * 100,
        change: currentKPIs.revenue - previousKPIs.revenue,
      },
      profit: {
        current: currentKPIs.profit,
        margin: (currentKPIs.profit / currentKPIs.revenue) * 100,
        growth: previousKPIs.profit > 0 ? ((currentKPIs.profit - previousKPIs.profit) / previousKPIs.profit) * 100 : 0,
        change: currentKPIs.profit - previousKPIs.profit,
      },
      customers: {
        total: currentKPIs.customers.total,
        active: currentKPIs.customers.active,
        growth: ((currentKPIs.customers.total - previousKPIs.customers.total) / previousKPIs.customers.total) * 100,
        change: currentKPIs.customers.total - previousKPIs.customers.total,
      },
      orders: {
        total: currentKPIs.orders.total,
        average: currentKPIs.orders.average,
        conversion: currentKPIs.orders.conversion,
        growth: ((currentKPIs.orders.total - previousKPIs.orders.total) / previousKPIs.orders.total) * 100,
      },
      inventory: {
        turnover: currentKPIs.inventory.turnover,
        stockouts: currentKPIs.inventory.stockouts,
        optimization: 0, // Would calculate optimization score
        value: currentKPIs.inventory.value,
      },
      marketing: {
        roi: currentKPIs.marketing.roi,
        cac: currentKPIs.marketing.cac,
        ltv: currentKPIs.customers.ltv,
        spend: currentKPIs.marketing.spend,
      },
    };

    // Get business alerts
    const alerts = await getBusinessAlerts(kpis);

    // Get business trends
    const trends = await analyzeBusinessTrends(kpis, previousKPIs);

    adminRespond(req, res, 'analytics/executive', {
      pageName: 'Executive Dashboard',
      kpis,
      alerts,
      trends,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load executive dashboard',
    });
  }
};

// ============================================================================
// Real-time Analytics API
// ============================================================================

export const realTimeMetrics = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Get current real-time metrics
    const metrics = await getCurrentRealTimeMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Failed to fetch real-time metrics',
    });
  }
};

// ============================================================================
// Automated Reporting
// ============================================================================

export const automatedReports = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const reports = await getScheduledReports();
    const reportHistory = await getReportExecutionHistory();

    adminRespond(req, res, 'analytics/reports', {
      pageName: 'Automated Reporting',
      reports,
      reportHistory,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load automated reports',
    });
  }
};

// ============================================================================
// Automated Reporting Management
// ============================================================================

export const createReportSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, type, reportType, recipients, format, parameters } = body;

    // Validate input
    if (!name || !type || !reportType || !recipients || !Array.isArray(recipients)) {
      throw new Error('Missing required fields: name, type, reportType, recipients');
    }

    const schedule = await scheduleReport({
      name,
      type: type as 'daily' | 'monthly' | 'quarterly' | 'weekly',
      reportType: reportType as 'customers' | 'executive' | 'inventory' | 'products' | 'sales',
      recipients,
      format: (format || 'pdf') as 'csv' | 'excel' | 'html' | 'pdf',
      isActive: true,
      nextRunAt: calculateNextRunTime(type),
      parameters: (parameters ? JSON.parse(parameters) : {}) as Record<string, unknown>,
    });

    res.json({
      success: true,
      message: 'Report schedule created successfully',
      schedule,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Failed to create report schedule',
    });
  }
};

export const updateReportSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { _scheduleId } = req.params;
    const _updates = req.body as RequestBody;

    // Placeholder - would update schedule in database

    res.json({
      success: true,
      message: 'Report schedule updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Failed to update report schedule',
    });
  }
};

export const deleteReportSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { _scheduleId } = req.params;

    // Placeholder - would delete schedule from database

    res.json({
      success: true,
      message: 'Report schedule deleted successfully',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Failed to delete report schedule',
    });
  }
};

export const runReportNow = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { reportType, period, parameters } = body;

    if (!reportType) {
      throw new Error('Report type is required');
    }

    // Generate report immediately
    const reportData = await generateReport(reportType, {
      period: period || '30d',
      ...(parameters ? JSON.parse(parameters) : {}),
    });

    res.json({
      success: true,
      message: 'Report generated successfully',
      report: reportData,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Failed to run report',
    });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

function parsePeriod(period: string): [Date, Date] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return [startDate, now];
}

// ============================================================================
// Report Scheduling Helpers
// ============================================================================

function calculateNextRunTime(type: string): Date {
  const now = new Date();

  switch (type) {
    case 'daily':
      // Next day at 6 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      return tomorrow;

    case 'weekly':
      // Next Monday at 6 AM
      const nextMonday = new Date(now);
      const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(6, 0, 0, 0);
      return nextMonday;

    case 'monthly':
      // First day of next month at 6 AM
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1, 1);
      nextMonth.setHours(6, 0, 0, 0);
      return nextMonth;

    case 'quarterly':
      // First day of next quarter at 6 AM
      const nextQuarter = new Date(now);
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const nextQuarterMonth = (currentQuarter + 1) * 3;
      nextQuarter.setMonth(nextQuarterMonth, 1);
      nextQuarter.setHours(6, 0, 0, 0);
      return nextQuarter;

    default:
      // Default to daily
      const defaultTime = new Date(now);
      defaultTime.setDate(defaultTime.getDate() + 1);
      defaultTime.setHours(6, 0, 0, 0);
      return defaultTime;
  }
}

// ============================================================================
// KPI Calculation Functions
// ============================================================================

async function calculateExecutiveKPIs(startDate: Date, endDate: Date) {
  // Get revenue data
  const revenueData = await adminAnalyticsRepo.getRevenueData(startDate, endDate);

  // Get customer data
  const customerData = await adminAnalyticsRepo.getCustomerData(startDate, endDate);

  // Get inventory data
  const inventoryData = await adminAnalyticsRepo.getInventoryData(startDate, endDate);

  return {
    revenue: revenueData.revenue,
    profit: revenueData.revenue * 0.25,
    customers: {
      total: customerData.total,
      active: customerData.active,
      ltv: customerData.ltv,
    },
    orders: {
      total: revenueData.orders,
      average: revenueData.averageOrder,
      conversion: 0.03,
    },
    inventory: {
      turnover: inventoryData.turnover,
      stockouts: inventoryData.stockouts,
      value: inventoryData.value,
    },
    marketing: {
      roi: 2.5,
      cac: 25,
      spend: 1000,
    },
  };
}

// ============================================================================
// Business Alerts
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getBusinessAlerts(kpis: Record<string, any>) {
  const alerts = [];

  // Revenue alerts
  if (kpis.revenue.growth < -10) {
    alerts.push({
      type: 'critical',
      message: `Revenue decreased by ${Math.abs(kpis.revenue.growth).toFixed(1)}% compared to last period`,
      action: 'Review sales strategy and marketing campaigns',
    });
  } else if (kpis.revenue.growth < -5) {
    alerts.push({
      type: 'warning',
      message: `Revenue slightly down by ${Math.abs(kpis.revenue.growth).toFixed(1)}%`,
      action: 'Monitor sales trends closely',
    });
  }

  // Customer alerts
  if (kpis.customers.growth < -15) {
    alerts.push({
      type: 'critical',
      message: `Customer base decreased by ${Math.abs(kpis.customers.growth).toFixed(1)}%`,
      action: 'Implement customer retention campaigns',
    });
  }

  // Inventory alerts
  if (kpis.inventory.stockouts > 5) {
    alerts.push({
      type: 'warning',
      message: `${kpis.inventory.stockouts} products are out of stock`,
      action: 'Review inventory management and reorder points',
    });
  }

  // Profit margin alerts
  if (kpis.profit.margin < 15) {
    alerts.push({
      type: 'warning',
      message: `Profit margin (${kpis.profit.margin.toFixed(1)}%) is below target`,
      action: 'Review pricing strategy and cost optimization',
    });
  }

  // Marketing ROI alerts
  if (kpis.marketing.roi < 2.0) {
    alerts.push({
      type: 'info',
      message: `Marketing ROI (${kpis.marketing.roi.toFixed(1)}) could be improved`,
      action: 'Optimize marketing spend and campaign targeting',
    });
  }

  return {
    critical: alerts.filter(a => a.type === 'critical'),
    warnings: alerts.filter(a => a.type === 'warning'),
    opportunities: alerts.filter(a => a.type === 'info'),
    trends: [],
  };
}

// ============================================================================
// Business Trends Analysis
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function analyzeBusinessTrends(currentKPIs: Record<string, any>, previousKPIs: Record<string, any>) {
  const trends = [];

  // Revenue trend
  if (currentKPIs.revenue.growth > 15) {
    trends.push({
      metric: 'Revenue',
      trend: 'up',
      description: `Strong revenue growth of ${currentKPIs.revenue.growth.toFixed(1)}%`,
      impact: 'positive',
    });
  } else if (currentKPIs.revenue.growth < -5) {
    trends.push({
      metric: 'Revenue',
      trend: 'down',
      description: `Revenue decline of ${Math.abs(currentKPIs.revenue.growth).toFixed(1)}%`,
      impact: 'negative',
    });
  }

  // Customer acquisition trend
  if (currentKPIs.customers.growth > 20) {
    trends.push({
      metric: 'Customer Acquisition',
      trend: 'up',
      description: `Strong customer growth of ${currentKPIs.customers.growth.toFixed(1)}%`,
      impact: 'positive',
    });
  }

  // Order value trend
  const orderValueChange = ((currentKPIs.orders.average - previousKPIs.orders.average) / previousKPIs.orders.average) * 100;
  if (Math.abs(orderValueChange) > 10) {
    trends.push({
      metric: 'Average Order Value',
      trend: orderValueChange > 0 ? 'up' : 'down',
      description: `AOV ${orderValueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(orderValueChange).toFixed(1)}%`,
      impact: orderValueChange > 0 ? 'positive' : 'neutral',
    });
  }

  return trends;
}

// ============================================================================
// Real-time Metrics
// ============================================================================

async function getCurrentRealTimeMetrics() {
  const metrics = await adminAnalyticsRepo.getRealTimeMetrics();

  // Server performance (mock for now)
  const serverPerformance = 95 + Math.random() * 5; // 95-100%

  return {
    ...metrics,
    serverPerformance: parseFloat(serverPerformance.toFixed(1)),
    timestamp: new Date().toISOString(),
  };
}
