import type { AnalyticsDataPort } from '../../domain/repositories/AnalyticsDataPort';
import { logger } from '../../../../libs/logger';

export interface ChurnPredictorPort {
  predictCustomerChurn(
    customerId: string,
    historicalData: Array<{ date: Date; orders: number; revenueCents: number }>,
  ): Promise<{ churnProbability: number; riskLevel: 'low' | 'medium' | 'high'; factors: unknown[]; recommendations: string[] }>;
}

export interface ExecutiveKpis {
  revenueCents: number;
  profitCents: number;
  customers: { total: number; active: number; ltvCents: number };
  orders: { total: number; averageCents: number; conversion: number };
  inventory: { turnover: number; stockouts: number; valueCents: number };
  marketing: { roi: number; cac: number; spend: number };
}

export interface ExecutiveKpiDelta {
  revenue: { current: number; target: number; growth: number; change: number };
  profit: { current: number; margin: number; growth: number; change: number };
  customers: { total: number; active: number; growth: number; change: number };
  orders: { total: number; average: number; conversion: number; growth: number };
  inventory: { turnover: number; stockouts: number; optimization: number; value: number };
  marketing: { roi: number; cac: number; ltv: number; spend: number };
}

export class GetAnalyticsDataUseCase {
  constructor(
    private readonly port: AnalyticsDataPort,
    private readonly churnPredictor?: ChurnPredictorPort,
  ) {}

  async getSalesSummary(startDate: Date, endDate: Date) {
    return this.port.getSalesSummary(startDate, endDate);
  }
  async getTopProducts(startDate: Date, endDate: Date, sortBy?: 'revenue' | 'purchases' | 'views', limit?: number) {
    return this.port.getTopProducts(startDate, endDate, sortBy, limit);
  }
  async getCustomerCohorts() {
    return this.port.getCustomerCohorts();
  }
  async findRecentCustomerIds(limit: number) {
    return this.port.findRecentCustomerIds(limit);
  }
  async findCustomerPurchaseHistory(customerId: string, days: number) {
    return this.port.findCustomerPurchaseHistory(customerId, days);
  }
  async findRecentCustomerId() {
    return this.port.findRecentCustomerId();
  }
  async getRevenueData(startDate: Date, endDate: Date) {
    return this.port.getRevenueData(startDate, endDate);
  }
  async getCustomerData(startDate: Date, endDate: Date) {
    return this.port.getCustomerData(startDate, endDate);
  }
  async getInventoryData(startDate: Date, endDate: Date) {
    return this.port.getInventoryData(startDate, endDate);
  }
  async getRealTimeMetrics() {
    return this.port.getRealTimeMetrics();
  }

  /**
   * Churn analysis across the most recent customers. Per-customer failures are
   * tolerated and reported as low-risk placeholders.
   */
  async analyzeCustomerChurnRisk(limit: number, historyDays = 30) {
    if (!this.churnPredictor) {
      throw new Error('Churn predictor is not configured');
    }
    const predictor = this.churnPredictor;

    const customerIds = await this.port.findRecentCustomerIds(limit);
    return Promise.all(
      customerIds.map(async (customerId: string) => {
        try {
          const history = await this.port.findCustomerPurchaseHistory(customerId, historyDays);
          const analysis = await predictor.predictCustomerChurn(
            customerId,
            (history as Array<{ date: string | Date; orders: number; revenueCents: number }>).map(h => ({
              date: new Date(h.date),
              orders: Number(h.orders),
              revenueCents: Number(h.revenueCents),
            })),
          );
          return { customerId, ...analysis };
        } catch (error) {
          logger.warn('Churn analysis failed for customer:', error);
          return {
            customerId,
            churnProbability: 0,
            riskLevel: 'low' as const,
            factors: [],
            recommendations: [],
          };
        }
      }),
    );
  }

  /** Executive KPI snapshot composed from revenue, customer, and inventory data. */
  async getExecutiveKpis(startDate: Date, endDate: Date): Promise<ExecutiveKpis> {
    const revenueData = await this.getRevenueData(startDate, endDate);
    const customerData = await this.getCustomerData(startDate, endDate);
    const inventoryData = await this.getInventoryData(startDate, endDate);

    return {
      revenueCents: revenueData.revenueCents,
      profitCents: Math.round(revenueData.revenueCents * 0.25),
      customers: {
        total: customerData.total,
        active: customerData.active,
        ltvCents: customerData.ltvCents,
      },
      orders: {
        total: revenueData.orders,
        averageCents: revenueData.averageOrderCents,
        conversion: 0.03,
      },
      inventory: {
        turnover: inventoryData.turnover,
        stockouts: inventoryData.stockouts,
        valueCents: inventoryData.valueCents,
      },
      marketing: {
        roi: 2.5,
        cac: 25,
        spend: 1000,
      },
    };
  }

  /**
   * Full executive dashboard: current + previous period KPIs with deltas,
   * threshold-based business alerts, and trend analysis.
   */
  async getExecutiveDashboard(periodDays = 30): Promise<{
    kpis: ExecutiveKpiDelta;
    alerts: { critical: unknown[]; warnings: unknown[]; opportunities: unknown[]; trends: unknown[] };
    trends: unknown[];
  }> {
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

    const currentKPIs = await this.getExecutiveKpis(startDate, now);
    const previousKPIs = await this.getExecutiveKpis(prevStartDate, startDate);

    const kpis: ExecutiveKpiDelta = {
      revenue: {
        current: currentKPIs.revenueCents,
        target: currentKPIs.revenueCents * 1.15,
        growth: ((currentKPIs.revenueCents - previousKPIs.revenueCents) / previousKPIs.revenueCents) * 100,
        change: currentKPIs.revenueCents - previousKPIs.revenueCents,
      },
      profit: {
        current: currentKPIs.profitCents,
        margin: (currentKPIs.profitCents / currentKPIs.revenueCents) * 100,
        growth: previousKPIs.profitCents > 0 ? ((currentKPIs.profitCents - previousKPIs.profitCents) / previousKPIs.profitCents) * 100 : 0,
        change: currentKPIs.profitCents - previousKPIs.profitCents,
      },
      customers: {
        total: currentKPIs.customers.total,
        active: currentKPIs.customers.active,
        growth: ((currentKPIs.customers.total - previousKPIs.customers.total) / previousKPIs.customers.total) * 100,
        change: currentKPIs.customers.total - previousKPIs.customers.total,
      },
      orders: {
        total: currentKPIs.orders.total,
        average: currentKPIs.orders.averageCents,
        conversion: currentKPIs.orders.conversion,
        growth: ((currentKPIs.orders.total - previousKPIs.orders.total) / previousKPIs.orders.total) * 100,
      },
      inventory: {
        turnover: currentKPIs.inventory.turnover,
        stockouts: currentKPIs.inventory.stockouts, // Would calculate optimization score
        optimization: 0,
        value: currentKPIs.inventory.valueCents,
      },
      marketing: {
        roi: currentKPIs.marketing.roi,
        cac: currentKPIs.marketing.cac,
        ltv: currentKPIs.customers.ltvCents,
        spend: currentKPIs.marketing.spend,
      },
    };

    return {
      kpis,
      alerts: this.getBusinessAlerts(kpis),
      trends: this.analyzeBusinessTrends(kpis, previousKPIs),
    };
  }

  /** Threshold rules producing critical/warning/opportunity alerts from KPI deltas. */
  getBusinessAlerts(kpis: ExecutiveKpiDelta): { critical: unknown[]; warnings: unknown[]; opportunities: unknown[]; trends: unknown[] } {
    const alerts: Array<Record<string, unknown>> = [];

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

    if (kpis.customers.growth < -15) {
      alerts.push({
        type: 'critical',
        message: `Customer base decreased by ${Math.abs(kpis.customers.growth).toFixed(1)}%`,
        action: 'Implement customer retention campaigns',
      });
    }

    if (kpis.inventory.stockouts > 5) {
      alerts.push({
        type: 'warning',
        message: `${kpis.inventory.stockouts} products are out of stock`,
        action: 'Review inventory management and reorder points',
      });
    }

    if (kpis.profit.margin < 15) {
      alerts.push({
        type: 'warning',
        message: `Profit margin (${kpis.profit.margin.toFixed(1)}%) is below target`,
        action: 'Review pricing strategy and cost optimization',
      });
    }

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

  /** Trend analysis comparing current-period KPI deltas against the previous period. */
  analyzeBusinessTrends(kpis: ExecutiveKpiDelta, previousKPIs: ExecutiveKpis): Array<Record<string, unknown>> {
    const trends: Array<Record<string, unknown>> = [];

    if (kpis.revenue.growth > 15) {
      trends.push({
        metric: 'Revenue',
        trend: 'up',
        description: `Strong revenue growth of ${kpis.revenue.growth.toFixed(1)}%`,
        impact: 'positive',
      });
    } else if (kpis.revenue.growth < -5) {
      trends.push({
        metric: 'Revenue',
        trend: 'down',
        description: `Revenue decline of ${Math.abs(kpis.revenue.growth).toFixed(1)}%`,
        impact: 'negative',
      });
    }

    if (kpis.customers.growth > 20) {
      trends.push({
        metric: 'Customer Acquisition',
        trend: 'up',
        description: `Strong customer growth of ${kpis.customers.growth.toFixed(1)}%`,
        impact: 'positive',
      });
    }

    const orderValueChange = ((kpis.orders.average - previousKPIs.orders.averageCents) / previousKPIs.orders.averageCents) * 100;
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

  /** Real-time metrics enriched with (placeholder) server performance. */
  async getRealTimeMetricsEnriched() {
    const metrics = await this.getRealTimeMetrics();
    const serverPerformance = 95 + Math.random() * 5;

    return {
      ...metrics,
      serverPerformance: parseFloat(serverPerformance.toFixed(1)),
      timestamp: new Date().toISOString(),
    };
  }
}
