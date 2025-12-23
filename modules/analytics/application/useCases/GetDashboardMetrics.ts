/**
 * GetDashboardMetrics Use Case
 *
 * Retrieves key metrics for the dashboard including orders, revenue, customers.
 */

export interface GetDashboardMetricsInput {
  storeId?: string;
  startDate: Date;
  endDate: Date;
  compareWithPrevious?: boolean;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    orderId: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  previousPeriod?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalCustomers: number;
  };
}

export interface GetDashboardMetricsOutput {
  metrics: DashboardMetrics;
  period: {
    start: string;
    end: string;
  };
}

export class GetDashboardMetricsUseCase {
  constructor(private readonly analyticsRepository: any) {}

  async execute(input: GetDashboardMetricsInput): Promise<GetDashboardMetricsOutput> {
    const { storeId, startDate, endDate, compareWithPrevious } = input;

    // Get current period metrics
    const [orders, customers, topProducts] = await Promise.all([
      this.analyticsRepository.getOrderMetrics(storeId, startDate, endDate),
      this.analyticsRepository.getCustomerMetrics(storeId, startDate, endDate),
      this.analyticsRepository.getTopProducts(storeId, startDate, endDate, 5),
    ]);

    const recentOrders = await this.analyticsRepository.getRecentOrders(storeId, 10);

    const metrics: DashboardMetrics = {
      totalOrders: orders.count,
      totalRevenue: orders.revenue,
      averageOrderValue: orders.count > 0 ? orders.revenue / orders.count : 0,
      totalCustomers: customers.total,
      newCustomers: customers.new,
      conversionRate: customers.conversionRate || 0,
      topProducts,
      recentOrders,
    };

    // Get previous period metrics for comparison
    if (compareWithPrevious) {
      const periodDuration = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - periodDuration);
      const prevEnd = new Date(startDate.getTime());

      const [prevOrders, prevCustomers] = await Promise.all([
        this.analyticsRepository.getOrderMetrics(storeId, prevStart, prevEnd),
        this.analyticsRepository.getCustomerMetrics(storeId, prevStart, prevEnd),
      ]);

      metrics.previousPeriod = {
        totalOrders: prevOrders.count,
        totalRevenue: prevOrders.revenue,
        averageOrderValue: prevOrders.count > 0 ? prevOrders.revenue / prevOrders.count : 0,
        totalCustomers: prevCustomers.total,
      };
    }

    return {
      metrics,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }
}
