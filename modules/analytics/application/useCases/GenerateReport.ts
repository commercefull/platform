/**
 * Generate Report Use Case
 *
 * Generates a report of the specified type with given parameters.
 */

import { query, queryOne } from '../../../../libs/db';
import { ReportData } from '../../domain/entities/AnalyticsReport';
import { AnalyticsValidationError } from '../../domain/errors/AnalyticsErrors';

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

export class GenerateReportUseCase {
  async execute(reportType: string, parameters: Record<string, unknown>): Promise<ReportData> {
    const period = (parameters.period as string) || '30d';

    switch (reportType) {
      case 'sales':
        return await this.generateSalesReport(period, parameters);
      case 'customers':
        return await this.generateCustomerReport(period, parameters);
      case 'products':
        return await this.generateProductReport(period, parameters);
      case 'inventory':
        return await this.generateInventoryReport(period, parameters);
      case 'executive':
        return await this.generateExecutiveReport(period, parameters);
      default:
        throw new AnalyticsValidationError(`Unknown report type: ${reportType}`);
    }
  }

  private async generateSalesReport(period: string, _parameters: Record<string, unknown>): Promise<ReportData> {
    const [startDate, endDate] = parsePeriod(period);
    const generatedAt = new Date();

    const salesData = await query<
      Array<{ date: string; orders: string; revenue: string; customers: string }>
    >(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT customer_id) as customers
      FROM "order"
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date`,
      [startDate, endDate],
    );

    const salesDataSafe = salesData || [];

    const totalRevenue = salesDataSafe.reduce((sum, d) => sum + parseFloat(d.revenue || '0'), 0);
    const totalOrders = salesDataSafe.reduce((sum, d) => sum + parseInt(d.orders || '0'), 0);
    const totalCustomers = salesDataSafe.reduce((sum, d) => sum + parseInt(d.customers || '0'), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const topProducts = await query<
      Array<{ product_id: string; name: string; sales: string; revenue: string }>
    >(
      `SELECT
        p.product_id,
        p.name,
        SUM(oi.quantity) as sales,
        SUM(oi.total_price) as revenue
      FROM order_item oi
      JOIN product p ON oi.product_id = p.product_id
      JOIN "order" o ON oi.order_id = o.order_id
      WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'completed'
      GROUP BY p.product_id, p.name
      ORDER BY revenue DESC
      LIMIT 10`,
      [startDate, endDate],
    );

    return {
      title: 'Sales Performance Report',
      generatedAt,
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        conversionRate: 0,
      },
      data: salesDataSafe.map(d => ({
        date: d.date,
        orders: parseInt(d.orders || '0'),
        revenue: parseFloat(d.revenue || '0'),
        customers: parseInt(d.customers || '0'),
      })),
      charts: [
        {
          title: 'Revenue Trend',
          type: 'line',
          data: {
            labels: salesDataSafe.map(d => d.date),
            datasets: [
              {
                label: 'Revenue',
                data: salesDataSafe.map(d => parseFloat(d.revenue || '0')),
              },
            ],
          },
        },
        {
          title: 'Top Products by Revenue',
          type: 'bar',
          data: {
            labels: (topProducts || []).map((p) => p.name?.substring(0, 20) || ''),
            datasets: [
              {
                label: 'Revenue',
                data: (topProducts || []).map((p) => parseFloat(p.revenue || '0')),
              },
            ],
          },
        },
      ],
    };
  }

  private async generateCustomerReport(period: string, _parameters: Record<string, unknown>): Promise<ReportData> {
    const [startDate, endDate] = parsePeriod(period);

    const customerData = await query<
      Array<{ date: string; new_customers: string; returning_customers: string; orders: string; revenue: string }>
    >(
      `WITH customer_orders AS (
        SELECT
          DATE(o.created_at) as date,
          o.customer_id,
          COUNT(*) as order_count,
          SUM(o.total_amount) as revenue
        FROM "order" o
        WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'completed'
        GROUP BY DATE(o.created_at), o.customer_id
      ),
      customer_classification AS (
        SELECT
          date,
          customer_id,
          order_count,
          revenue,
          CASE
            WHEN order_count = 1 THEN 'new'
            ELSE 'returning'
          END as customer_type
        FROM customer_orders
      )
      SELECT
        date,
        COUNT(CASE WHEN customer_type = 'new' THEN 1 END) as new_customers,
        COUNT(CASE WHEN customer_type = 'returning' THEN 1 END) as returning_customers,
        SUM(order_count) as orders,
        SUM(revenue) as revenue
      FROM customer_classification
      GROUP BY date
      ORDER BY date`,
      [startDate, endDate],
    );

    const segmentData = await query<
      Array<{ segment: string; customers: string; revenue: string }>
    >(
      `SELECT
        CASE
          WHEN total_spent > 500 THEN 'High Value'
          WHEN total_spent BETWEEN 100 AND 500 THEN 'Regular'
          ELSE 'Low Value'
        END as segment,
        COUNT(*) as customers,
        SUM(total_spent) as revenue
      FROM (
        SELECT customer_id, SUM(total_amount) as total_spent
        FROM "order"
        WHERE created_at >= $1 AND created_at <= $2 AND status = 'completed'
        GROUP BY customer_id
      ) customer_totals
      GROUP BY
        CASE
          WHEN total_spent > 500 THEN 'High Value'
          WHEN total_spent BETWEEN 100 AND 500 THEN 'Regular'
          ELSE 'Low Value'
        END`,
      [startDate, endDate],
    );

    const customerDataSafe = customerData || [];
    const segmentDataSafe = segmentData || [];

    const totalRevenue = customerDataSafe.reduce((sum, d) => sum + parseFloat(d.revenue || '0'), 0);
    const totalNewCustomers = customerDataSafe.reduce((sum, d) => sum + parseInt(d.new_customers || '0'), 0);
    const totalReturningCustomers = customerDataSafe.reduce((sum, d) => sum + parseInt(d.returning_customers || '0'), 0);

    return {
      title: 'Customer Analytics Report',
      generatedAt: new Date(),
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        totalRevenue,
        newCustomers: totalNewCustomers,
        returningCustomers: totalReturningCustomers,
        customerSegments: segmentDataSafe.length,
      },
      data: customerDataSafe.map(d => ({
        date: d.date,
        newCustomers: parseInt(d.new_customers || '0'),
        returningCustomers: parseInt(d.returning_customers || '0'),
        orders: parseInt(d.orders || '0'),
        revenue: parseFloat(d.revenue || '0'),
      })),
      charts: [
        {
          title: 'Customer Acquisition Trend',
          type: 'area',
          data: {
            labels: customerDataSafe.map(d => d.date),
            datasets: [
              { label: 'New Customers', data: customerDataSafe.map(d => parseInt(d.new_customers || '0')) },
              { label: 'Returning Customers', data: customerDataSafe.map(d => parseInt(d.returning_customers || '0')) },
            ],
          },
        },
        {
          title: 'Customer Segments',
          type: 'pie',
          data: {
            labels: segmentDataSafe.map(s => s.segment),
            datasets: [
              {
                data: segmentDataSafe.map(s => parseInt(s.customers || '0')),
              },
            ],
          },
        },
      ],
    };
  }

  private async generateProductReport(period: string, _parameters: Record<string, unknown>): Promise<ReportData> {
    const [startDate, endDate] = parsePeriod(period);

    const productData = await query<
      Array<{ product_id: string; name: string; category: string; sales: string; revenue: string; stock: string; views: string }>
    >(
      `SELECT
        p.product_id,
        p.name,
        p.category,
        COALESCE(SUM(oi.quantity), 0) as sales,
        COALESCE(SUM(oi.total_price), 0) as revenue,
        p.stock_quantity as stock,
        COALESCE(ap.views, 0) as views
      FROM product p
      LEFT JOIN order_item oi ON p.product_id = oi.product_id
      LEFT JOIN "order" o ON oi.order_id = o.order_id AND o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'completed'
      LEFT JOIN analyticsProductPerformance ap ON p.product_id = ap.productId AND ap.date >= $1 AND ap.date <= $2
      GROUP BY p.product_id, p.name, p.category, p.stock_quantity, ap.views
      ORDER BY revenue DESC`,
      [startDate, endDate],
    );

    const productDataSafe = productData || [];

    return {
      title: 'Product Performance Report',
      generatedAt: new Date(),
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        totalProducts: productDataSafe.length,
        totalRevenue: productDataSafe.reduce((sum, p) => sum + parseFloat(p.revenue || '0'), 0),
        totalSales: productDataSafe.reduce((sum, p) => sum + parseInt(p.sales || '0'), 0),
        lowStockProducts: productDataSafe.filter(p => parseInt(p.stock || '0') < 10).length,
      },
      data: productDataSafe.map(p => ({
        productId: p.product_id,
        name: p.name,
        category: p.category,
        sales: parseInt(p.sales || '0'),
        revenue: parseFloat(p.revenue || '0'),
        stock: parseInt(p.stock || '0'),
        views: parseInt(p.views || '0'),
      })),
    };
  }

  private async generateInventoryReport(_period: string, _parameters: Record<string, unknown>): Promise<ReportData> {
    const inventoryData = await query<
      Array<{ product_id: string; name: string; category: string; stock_quantity: string; reorder_point: string; cost_price: string; sales_velocity: string }>
    >(
      `SELECT
        p.product_id,
        p.name,
        p.category,
        p.stock_quantity,
        p.reorder_point,
        p.cost_price,
        COALESCE(AVG(oi.quantity), 0) as sales_velocity
      FROM product p
      LEFT JOIN order_item oi ON p.product_id = oi.product_id
      LEFT JOIN "order" o ON oi.order_id = o.order_id AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.product_id, p.name, p.category, p.stock_quantity, p.reorder_point, p.cost_price
      ORDER BY p.stock_quantity ASC`,
    );

    const inventoryDataSafe = inventoryData || [];

    const lowStock = inventoryDataSafe.filter(p => parseInt(p.stock_quantity || '0') <= parseInt(p.reorder_point || '10'));
    const totalValue = inventoryDataSafe.reduce((sum, p) => sum + parseInt(p.stock_quantity || '0') * parseFloat(p.cost_price || '0'), 0);

    return {
      title: 'Inventory Status Report',
      generatedAt: new Date(),
      period: 'Current',
      summary: {
        totalProducts: inventoryDataSafe.length,
        lowStockProducts: lowStock.length,
        totalInventoryValue: totalValue,
        stockoutRisk: lowStock.filter(p => parseInt(p.stock_quantity || '0') === 0).length,
      },
      data: inventoryDataSafe.map(p => ({
        productId: p.product_id,
        name: p.name,
        category: p.category,
        stockQuantity: parseInt(p.stock_quantity || '0'),
        reorderPoint: parseInt(p.reorder_point || '10'),
        costPrice: parseFloat(p.cost_price || '0'),
        salesVelocity: parseFloat(p.sales_velocity || '0'),
        status: parseInt(p.stock_quantity || '0') <= parseInt(p.reorder_point || '10') ? 'Low Stock' : 'In Stock',
      })),
    };
  }

  private async generateExecutiveReport(period: string, _parameters: Record<string, unknown>): Promise<ReportData> {
    const [startDate, endDate] = parsePeriod(period);

    const executiveData = await queryOne<{ revenue: string; orders: string; customers: string; profit: string }>(
      `SELECT
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_id) as customers,
        COALESCE(SUM(total_amount) * 0.25, 0) as profit
      FROM "order"
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'completed'`,
      [startDate, endDate],
    );

    return {
      title: 'Executive Summary Report',
      generatedAt: new Date(),
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        totalRevenue: parseFloat(executiveData?.revenue || '0'),
        totalOrders: parseInt(executiveData?.orders || '0'),
        totalCustomers: parseInt(executiveData?.customers || '0'),
        totalProfit: parseFloat(executiveData?.profit || '0'),
        profitMargin:
          parseFloat(executiveData?.revenue || '0') > 0
            ? (parseFloat(executiveData?.profit || '0') / parseFloat(executiveData?.revenue || '0')) * 100
            : 0,
      },
      data: [],
    };
  }
}

export const generateReportUseCase = new GenerateReportUseCase();
