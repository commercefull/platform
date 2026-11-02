/**
 * Analytics Wired Use Cases
 *
 * Pre-instantiated use cases with infrastructure dependencies resolved.
 * Controllers import from this file — never from infrastructure/.
 */

import {
  getCustomerCohorts,
  getSalesSummary,
  getTopProducts,
} from '../infrastructure/repositories/analyticsRepo';
import {
  findCustomerPurchaseHistory,
  findRecentCustomerId,
  findRecentCustomerIds,
  getCustomerData,
  getInventoryData,
  getRealTimeMetrics,
  getRevenueData,
} from '../infrastructure/repositories/adminAnalyticsRepo';
import { GetAnalyticsDataUseCase } from './useCases/GetAnalyticsData';
import { GenerateSalesReportUseCase } from './useCases/GenerateSalesReport';
import { ManageAnalyticsReportingUseCase } from './useCases/ManageAnalyticsReporting';
import analyticsDataRepository from '../infrastructure/repositories/AnalyticsDataRepository';
import dashboardQueryRepository from '../infrastructure/repositories/DashboardQueryRepository';

const analyticsDataPort = {
  getSalesSummary: getSalesSummary,
  getTopProducts: getTopProducts,
  getCustomerCohorts: getCustomerCohorts,
  findRecentCustomerIds: findRecentCustomerIds,
  findCustomerPurchaseHistory: findCustomerPurchaseHistory,
  findRecentCustomerId: findRecentCustomerId,
  getRevenueData: getRevenueData,
  getCustomerData: getCustomerData,
  getInventoryData: getInventoryData,
  getRealTimeMetrics: getRealTimeMetrics,
};

import { predictiveAnalyticsUseCase } from './useCases/PredictiveAnalytics';

export const getAnalyticsDataUseCase = new GetAnalyticsDataUseCase(analyticsDataPort, predictiveAnalyticsUseCase);
export const generateSalesReportUseCase = new GenerateSalesReportUseCase(analyticsDataPort);
export const manageAnalyticsReportingUseCase = new ManageAnalyticsReportingUseCase(
  analyticsDataRepository.analytics,
  analyticsDataRepository.reporting,
);

export { analyticsDataRepository, dashboardQueryRepository };

import { GetDashboardMetricsUseCase } from './useCases/GetDashboardMetrics';
import { GetSalesAnalyticsUseCase } from './useCases/GetSalesAnalytics';
import { GetProductPerformanceUseCase } from './useCases/GetProductPerformance';
import { TrackPageViewUseCase } from './useCases/TrackPageView';

export const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(analyticsDataRepository.dashboard as never);
export const getSalesAnalyticsUseCase = new GetSalesAnalyticsUseCase(analyticsDataRepository.dashboard as never);
export const getProductPerformanceUseCase = new GetProductPerformanceUseCase(analyticsDataRepository.dashboard as never);
export const trackPageViewUseCase = new TrackPageViewUseCase();
