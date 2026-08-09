/**
 * Admin Analytics Repository
 * Handles legacy analytics queries for the admin hub that use snake_case column names
 * (customer_id, created_at, total_amount, etc.) from the order table
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Predictive Analytics
// ============================================================================

export async function findRecentCustomerIds(limit: number = 10): Promise<string[]> {
  const results = await query<Array<{ customer_id: string }>>(
    `SELECT DISTINCT customer_id FROM "order"
     WHERE status = 'completed'
     ORDER BY customer_id LIMIT $1`,
    [limit],
  );
  return (results || []).map(r => r.customer_id);
}

export async function findCustomerPurchaseHistory(customerId: string, limit: number = 30): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
       FROM "order"
       WHERE customer_id = $1 AND status = 'completed'
       GROUP BY DATE(created_at)
       ORDER BY date DESC LIMIT $2`,
      [customerId, limit],
    )) || []
  );
}

// ============================================================================
// AI Recommendations
// ============================================================================

export async function findRecentCustomerId(): Promise<string | null> {
  const result = await queryOne<{ customer_id: string }>(
    `SELECT customer_id FROM "order"
     WHERE status = 'completed'
     ORDER BY created_at DESC LIMIT 1`,
  );
  return result?.customer_id || null;
}

// ============================================================================
// Executive KPIs
// ============================================================================

export async function getRevenueData(startDate: Date, endDate: Date): Promise<{
  revenue: number;
  orders: number;
  averageOrder: number;
  customers: number;
}> {
  const result = await queryOne<{
    revenue: string;
    orders: string;
    average_order: string;
    customers: string;
  }>(
    `SELECT
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as orders,
      CASE WHEN COUNT(*) > 0 THEN AVG(total_amount) ELSE 0 END as average_order,
      COUNT(DISTINCT customer_id) as customers
    FROM "order"
    WHERE created_at >= $1 AND created_at <= $2 AND status = 'completed'`,
    [startDate, endDate],
  );

  return {
    revenue: parseFloat(result?.revenue || '0'),
    orders: parseInt(result?.orders || '0'),
    averageOrder: parseFloat(result?.average_order || '0'),
    customers: parseInt(result?.customers || '0'),
  };
}

export async function getCustomerData(startDate: Date, endDate: Date): Promise<{
  total: number;
  active: number;
  ltv: number;
}> {
  const result = await queryOne<{
    total: string;
    active: string;
    ltv: string;
  }>(
    `WITH customer_stats AS (
      SELECT
        customer_id,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent,
        MAX(created_at) as last_order
      FROM "order"
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'completed'
      GROUP BY customer_id
    )
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN last_order >= $3 - INTERVAL '30 days' THEN 1 END) as active,
      COALESCE(AVG(total_spent), 0) as ltv
    FROM customer_stats`,
    [startDate, endDate, endDate],
  );

  return {
    total: parseInt(result?.total || '0'),
    active: parseInt(result?.active || '0'),
    ltv: parseFloat(result?.ltv || '0'),
  };
}

export async function getInventoryData(startDate: Date, endDate: Date): Promise<{
  turnover: number;
  stockouts: number;
  value: number;
}> {
  const result = await queryOne<{
    turnover: string;
    stockouts: string;
    value: string;
  }>(
    `WITH sales_data AS (
      SELECT
        SUM(oi.quantity) as total_sold,
        AVG(p.cost_price * oi.quantity) as avg_cost
      FROM order_item oi
      JOIN product p ON oi.product_id = p.product_id
      JOIN "order" o ON oi.order_id = o.order_id
      WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'completed'
    ),
    inventory_data AS (
      SELECT
        SUM(stock_quantity * cost_price) as total_value,
        COUNT(CASE WHEN stock_quantity <= reorder_point THEN 1 END) as stockouts
      FROM product
      WHERE is_active = true
    )
    SELECT
      CASE WHEN i.total_value > 0 THEN s.total_sold / i.total_value ELSE 0 END as turnover,
      i.stockouts,
      i.total_value as value
    FROM sales_data s, inventory_data i`,
    [startDate, endDate],
  );

  return {
    turnover: parseFloat(result?.turnover || '0'),
    stockouts: parseInt(result?.stockouts || '0'),
    value: parseFloat(result?.value || '0'),
  };
}

// ============================================================================
// Real-time Metrics
// ============================================================================

export async function getRealTimeMetrics(): Promise<{
  activeUsers: number;
  currentOrders: number;
  revenueToday: number;
  conversionRate: number;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeUsersResult, currentOrdersResult, revenueTodayResult, checkoutStartedResult, checkoutCompletedResult] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT customer_id) as count
       FROM "order"
       WHERE created_at >= $1 AND status IN ('pending', 'processing', 'completed')`,
      [oneHourAgo],
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM "order"
       WHERE created_at >= $1 AND status IN ('pending', 'processing')`,
      [oneHourAgo],
    ),
    queryOne<{ revenue: string }>(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue
       FROM "order"
       WHERE created_at >= $1 AND status = 'completed'`,
      [todayStart],
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "analyticsSalesDaily"
       WHERE "date" >= $1 AND "checkoutStarted" > 0`,
      [todayStart],
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "analyticsSalesDaily"
       WHERE "date" >= $1 AND "checkoutCompleted" > 0`,
      [todayStart],
    ),
  ]);

  const checkoutStarted = parseInt(checkoutStartedResult?.count || '0');
  const checkoutCompleted = parseInt(checkoutCompletedResult?.count || '0');
  const conversionRate = checkoutStarted > 0 ? (checkoutCompleted / checkoutStarted) * 100 : 0;

  return {
    activeUsers: parseInt(activeUsersResult?.count || '0'),
    currentOrders: parseInt(currentOrdersResult?.count || '0'),
    revenueToday: parseFloat(revenueTodayResult?.revenue || '0'),
    conversionRate: parseFloat(conversionRate.toFixed(2)),
  };
}

export default {
  findRecentCustomerIds,
  findCustomerPurchaseHistory,
  findRecentCustomerId,
  getRevenueData,
  getCustomerData,
  getInventoryData,
  getRealTimeMetrics,
};
