import type {
  AnalyticsReportDashboard,
  AnalyticsReportEvent,
  AnalyticsReportSnapshot,
  CustomerCohort,
  ProductPerformance,
} from '../../domain/types';

export interface AnalyticsSalesDailyRecord {
  analyticsSalesDailyId: string;
  organizationId?: string;
  date: Date;
  channel: string;
  currency: string;
  orderCount: number;
  itemsSold: number;
  grossRevenueCents: number;
  discountTotalCents: number;
  refundTotalCents: number;
  netRevenueCents: number;
  taxTotalCents: number;
  shippingRevenueCents: number;
  averageOrderValueCents: number;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  cartCreated: number;
  cartAbandoned: number;
  checkoutStarted: number;
  checkoutCompleted: number;
  conversionRate: number;
  paymentSuccessCount: number;
  paymentFailedCount: number;
  paymentSuccessRate: number;
  computedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsSearchQueryRecord {
  analyticsSearchQueryId: string;
  organizationId?: string;
  query: string;
  queryNormalized?: string;
  date: Date;
  searchCount: number;
  uniqueSearchers: number;
  resultCount: number;
  isZeroResult: boolean;
  clickCount: number;
  clickThroughRate: number;
  averageClickPosition: number;
  addToCartCount: number;
  purchaseCount: number;
  conversionRate: number;
  revenueCents: number;
  refinementCount: number;
  exitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesSummaryRecord {
  totalRevenueCents: number;
  totalOrders: number;
  averageOrderValueCents: number;
  newCustomers: number;
  conversionRate: number;
}

export interface RealTimeMetrics {
  activeVisitors: number;
  ordersLastHour: number;
  revenueLastHour: number;
  cartsCreated: number;
  checkoutsStarted: number;
  [key: string]: unknown;
}

export interface ReportEventFilters {
  eventType?: string;
  eventCategory?: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  startDate?: Date;
  endDate?: Date;
  isProcessed?: boolean;
}

export interface ReportPagination {
  limit?: number;
  offset?: number;
}

export interface DashboardSaveInput extends Partial<AnalyticsReportDashboard> {
  name: string;
}

interface AnalyticsPort {
  getSalesSummary(startDate: Date, endDate: Date, organizationId?: string): Promise<SalesSummaryRecord>;
  getSalesDaily(
    filters: { startDate?: Date; endDate?: Date; channel?: string; organizationId?: string },
    pagination?: ReportPagination,
  ): Promise<{ data: AnalyticsSalesDailyRecord[]; total: number }>;
  getProductPerformance(
    filters: { productId?: string; startDate?: Date; endDate?: Date },
    pagination?: ReportPagination,
  ): Promise<{ data: ProductPerformance[]; total: number }>;
  getTopProducts(
    startDate: Date,
    endDate: Date,
    metric?: 'revenue' | 'purchases' | 'views',
    limit?: number,
  ): Promise<ProductPerformance[]>;
  getSearchQueries(
    filters: { startDate?: Date; endDate?: Date; isZeroResult?: boolean; query?: string },
    pagination?: ReportPagination,
  ): Promise<{ data: AnalyticsSearchQueryRecord[]; total: number }>;
  getCustomerCohorts(startMonth?: Date, endMonth?: Date): Promise<CustomerCohort[]>;
}

interface ReportingPort {
  getEvents(filters: ReportEventFilters, pagination?: ReportPagination): Promise<{ data: AnalyticsReportEvent[]; total: number }>;
  getEventCounts(startDate: Date, endDate: Date, groupBy?: 'hour' | 'day'): Promise<{ period: string; eventType: string; count: number }[]>;
  getSnapshots(
    snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<AnalyticsReportSnapshot[]>;
  getLatestSnapshot(
    snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly',
    organizationId?: string,
  ): Promise<AnalyticsReportSnapshot | null>;
  getDashboards(organizationId?: string): Promise<AnalyticsReportDashboard[]>;
  getDashboard(dashboardId: string): Promise<AnalyticsReportDashboard | null>;
  saveDashboard(dashboard: DashboardSaveInput): Promise<AnalyticsReportDashboard>;
  deleteDashboard(dashboardId: string): Promise<void>;
  getRealTimeMetrics(organizationId?: string, minutes?: number): Promise<RealTimeMetrics>;
}

export class ManageAnalyticsReportingUseCase {
  constructor(
    private readonly analytics: AnalyticsPort,
    private readonly reporting: ReportingPort,
  ) {}

  async getSalesSummary(startDate: Date, endDate: Date, organizationId?: string) {
    return this.analytics.getSalesSummary(startDate, endDate, organizationId);
  }
  async getSalesDaily(
    filters: { startDate?: Date; endDate?: Date; channel?: string; organizationId?: string },
    pagination?: ReportPagination,
  ) {
    return this.analytics.getSalesDaily(filters, pagination);
  }
  async getProductPerformance(
    filters: { productId?: string; startDate?: Date; endDate?: Date },
    pagination?: ReportPagination,
  ) {
    return this.analytics.getProductPerformance(filters, pagination);
  }
  async getTopProducts(startDate: Date, endDate: Date, metric?: 'revenue' | 'purchases' | 'views', limit?: number) {
    return this.analytics.getTopProducts(startDate, endDate, metric, limit);
  }
  async getSearchQueries(
    filters: { startDate?: Date; endDate?: Date; isZeroResult?: boolean; query?: string },
    pagination?: ReportPagination,
  ) {
    return this.analytics.getSearchQueries(filters, pagination);
  }
  async getCustomerCohorts(startMonth?: Date, endMonth?: Date) {
    return this.analytics.getCustomerCohorts(startMonth, endMonth);
  }

  async getEvents(filters: ReportEventFilters, pagination?: ReportPagination) {
    return this.reporting.getEvents(filters, pagination);
  }
  async getEventCounts(startDate: Date, endDate: Date, groupBy?: 'hour' | 'day') {
    return this.reporting.getEventCounts(startDate, endDate, groupBy);
  }
  async getSnapshots(
    snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ) {
    return this.reporting.getSnapshots(snapshotType, startDate, endDate, organizationId);
  }
  async getLatestSnapshot(snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly', organizationId?: string) {
    return this.reporting.getLatestSnapshot(snapshotType, organizationId);
  }
  async getDashboards(organizationId?: string) {
    return this.reporting.getDashboards(organizationId);
  }
  async getDashboard(dashboardId: string) {
    return this.reporting.getDashboard(dashboardId);
  }
  async saveDashboard(dashboard: DashboardSaveInput) {
    return this.reporting.saveDashboard(dashboard);
  }
  async deleteDashboard(dashboardId: string) {
    return this.reporting.deleteDashboard(dashboardId);
  }
  async getRealTimeMetrics(organizationId?: string, minutes?: number) {
    return this.reporting.getRealTimeMetrics(organizationId, minutes);
  }
}
