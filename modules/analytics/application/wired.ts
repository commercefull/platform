/**
 * Analytics Wired Use Cases
 *
 * Pre-instantiated use cases with infrastructure dependencies resolved.
 * Controllers import from this file — never from infrastructure/.
 */

import * as analyticsRepo from '../infrastructure/repositories/analyticsRepo';
import * as adminAnalyticsRepo from '../infrastructure/repositories/adminAnalyticsRepo';
import { GetAnalyticsDataUseCase } from './useCases/GetAnalyticsData';
import { GenerateSalesReportUseCase } from './useCases/GenerateSalesReport';

const analyticsDataPort = {
  getSalesSummary: analyticsRepo.getSalesSummary,
  getTopProducts: analyticsRepo.getTopProducts,
  getCustomerCohorts: analyticsRepo.getCustomerCohorts,
  findRecentCustomerIds: adminAnalyticsRepo.findRecentCustomerIds,
  findCustomerPurchaseHistory: adminAnalyticsRepo.findCustomerPurchaseHistory,
  findRecentCustomerId: adminAnalyticsRepo.findRecentCustomerId,
  getRevenueData: adminAnalyticsRepo.getRevenueData,
  getCustomerData: adminAnalyticsRepo.getCustomerData,
  getInventoryData: adminAnalyticsRepo.getInventoryData,
  getRealTimeMetrics: adminAnalyticsRepo.getRealTimeMetrics,
};

export const getAnalyticsDataUseCase = new GetAnalyticsDataUseCase(analyticsDataPort);
export const generateSalesReportUseCase = new GenerateSalesReportUseCase(analyticsDataPort);
