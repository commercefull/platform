/**
 * Analytics Data Port
 *
 * Domain port for analytics data queries (dashboard, sales, admin).
 * Infrastructure implementations must structurally satisfy this interface.
 */

import type { ProductPerformance, CustomerCohort } from '../types';

export interface SalesSummary {
  totalRevenueCents: number;
  totalOrders: number;
  averageOrderValueCents: number;
  newCustomers: number;
  conversionRate: number;
}

export interface RevenueData {
  revenueCents: number;
  orders: number;
  averageOrderCents: number;
  customers: number;
}

export interface CustomerData {
  total: number;
  active: number;
  ltvCents: number;
}

export interface InventoryData {
  turnover: number;
  stockouts: number;
  valueCents: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentOrders: number;
  revenueTodayCents: number;
  conversionRate: number;
}

export interface AnalyticsDataPort {
  getSalesSummary(startDate: Date, endDate: Date, organizationId?: string): Promise<SalesSummary>;
  getTopProducts(startDate: Date, endDate: Date, metric?: 'revenue' | 'purchases' | 'views', limit?: number): Promise<ProductPerformance[]>;
  getCustomerCohorts(startMonth?: Date, endMonth?: Date): Promise<CustomerCohort[]>;
  findRecentCustomerIds(limit: number): Promise<string[]>;
  findCustomerPurchaseHistory(customerId: string, limit: number): Promise<unknown[]>;
  findRecentCustomerId(): Promise<string | null>;
  getRevenueData(startDate: Date, endDate: Date): Promise<RevenueData>;
  getCustomerData(startDate: Date, endDate: Date): Promise<CustomerData>;
  getInventoryData(startDate: Date, endDate: Date): Promise<InventoryData>;
  getRealTimeMetrics(): Promise<RealTimeMetrics>;
}
