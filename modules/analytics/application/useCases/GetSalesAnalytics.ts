/**
 * GetSalesAnalytics Use Case
 *
 * Provides detailed sales analytics with breakdowns by time, category, channel.
 */

export interface GetSalesAnalyticsInput {
  storeId?: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
  breakdown?: 'category' | 'channel' | 'product' | 'customer';
}

export interface SalesDataPoint {
  date: string;
  orders: number;
  revenue: number;
  units: number;
  averageOrderValue: number;
}

export interface SalesBreakdown {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface GetSalesAnalyticsOutput {
  timeSeries: SalesDataPoint[];
  totals: {
    orders: number;
    revenue: number;
    units: number;
    averageOrderValue: number;
  };
  breakdown?: SalesBreakdown[];
  growth: {
    ordersGrowth: number;
    revenueGrowth: number;
  };
}

export class GetSalesAnalyticsUseCase {
  constructor(private readonly analyticsRepository: any) {}

  async execute(input: GetSalesAnalyticsInput): Promise<GetSalesAnalyticsOutput> {
    const { storeId, startDate, endDate, groupBy, breakdown } = input;

    // Get time series data
    const timeSeries = await this.analyticsRepository.getSalesTimeSeries(storeId, startDate, endDate, groupBy);

    // Calculate totals
    const totals = timeSeries.reduce(
      (acc: any, point: SalesDataPoint) => ({
        orders: acc.orders + point.orders,
        revenue: acc.revenue + point.revenue,
        units: acc.units + point.units,
        averageOrderValue: 0,
      }),
      { orders: 0, revenue: 0, units: 0, averageOrderValue: 0 },
    );
    totals.averageOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;

    // Get breakdown if requested
    let breakdownData: SalesBreakdown[] | undefined;
    if (breakdown) {
      const rawBreakdown = await this.analyticsRepository.getSalesBreakdown(storeId, startDate, endDate, breakdown);

      // Calculate percentages
      breakdownData = rawBreakdown.map((item: SalesBreakdown) => ({
        ...item,
        percentage: totals.revenue > 0 ? (item.revenue / totals.revenue) * 100 : 0,
      }));
    }

    // Calculate growth (compare with previous period)
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - periodDuration);
    const prevEnd = new Date(startDate.getTime());

    const prevTotals = await this.analyticsRepository.getSalesTotals(storeId, prevStart, prevEnd);

    const growth = {
      ordersGrowth: prevTotals.orders > 0 ? ((totals.orders - prevTotals.orders) / prevTotals.orders) * 100 : 0,
      revenueGrowth: prevTotals.revenue > 0 ? ((totals.revenue - prevTotals.revenue) / prevTotals.revenue) * 100 : 0,
    };

    return {
      timeSeries,
      totals,
      breakdown: breakdownData,
      growth,
    };
  }
}
