/**
 * Admin Analytics Repository
 * Handles analytics queries for the admin hub.
 * All monetary values are integer cents.
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Predictive Analytics
// ============================================================================

export async function findRecentCustomerIds(limit: number = 10): Promise<string[]> {
  const results = await query<Array<{ customer_id: string }>>(
    `SELECT DISTINCT "customerId" as customer_id FROM "order"
     WHERE status = 'completed'
     ORDER BY "customerId" LIMIT $1`,
    [limit],
  );
  return (results || []).map(r => r.customer_id);
}

export async function findCustomerPurchaseHistory(customerId: string, limit: number = 30): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT
        DATE("createdAt") as date,
        COUNT(*) as orders,
        SUM("totalAmountCents") as revenue
       FROM "order"
       WHERE "customerId" = $1 AND status = 'completed'
       GROUP BY DATE("createdAt")
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
    `SELECT "customerId" as customer_id FROM "order"
     WHERE status = 'completed'
     ORDER BY "createdAt" DESC LIMIT 1`,
  );
  return result?.customer_id || null;
}

// ============================================================================
// Executive KPIs
// ============================================================================

export async function getRevenueData(
  startDate: Date,
  endDate: Date,
): Promise<{
  revenueCents: number;
  orders: number;
  averageOrderCents: number;
  customers: number;
}> {
  const result = await queryOne<{
    revenue: string;
    orders: string;
    average_order: string;
    customers: string;
  }>(
    `SELECT
      COALESCE(SUM("totalAmountCents"), 0) as revenue,
      COUNT(*) as orders,
      CASE WHEN COUNT(*) > 0 THEN AVG("totalAmountCents") ELSE 0 END as average_order,
      COUNT(DISTINCT "customerId") as customers
    FROM "order"
    WHERE "createdAt" >= $1 AND "createdAt" <= $2 AND status = 'completed'`,
    [startDate, endDate],
  );

  return {
    revenueCents: parseFloat(result?.revenue || '0'),
    orders: parseInt(result?.orders || '0'),
    averageOrderCents: parseFloat(result?.average_order || '0'),
    customers: parseInt(result?.customers || '0'),
  };
}

export async function getCustomerData(
  startDate: Date,
  endDate: Date,
): Promise<{
  total: number;
  active: number;
  ltvCents: number;
}> {
  const result = await queryOne<{
    total: string;
    active: string;
    ltv: string;
  }>(
    `WITH customer_stats AS (
      SELECT
        "customerId",
        COUNT(*) as order_count,
        SUM("totalAmountCents") as total_spent,
        MAX("createdAt") as last_order
      FROM "order"
      WHERE "createdAt" >= $1 AND "createdAt" <= $2 AND status = 'completed'
      GROUP BY "customerId"
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
    ltvCents: parseFloat(result?.ltv || '0'),
  };
}

export async function getInventoryData(
  startDate: Date,
  endDate: Date,
): Promise<{
  turnover: number;
  stockouts: number;
  valueCents: number;
}> {
  const result = await queryOne<{
    turnover: string;
    stockouts: string;
    value: string;
  }>(
    `WITH sales_data AS (
      SELECT
        SUM(oi.quantity) as total_sold,
        AVG(bp."costPriceCents" * oi.quantity) as avg_cost
      FROM "orderItem" oi
      JOIN "productBasePrice" bp ON bp."productId" = oi."productId" AND bp."productVariantId" IS NULL
      JOIN "order" o ON oi."orderId" = o."orderId"
      WHERE o."createdAt" >= $1 AND o."createdAt" <= $2 AND o.status = 'completed'
    ),
    inventory_data AS (
      SELECT
        SUM(il."onHandQuantity" * COALESCE(bp."costPriceCents", 0)) as total_value,
        COUNT(CASE WHEN il."onHandQuantity" <= COALESCE(il."minStockLevel", 0) THEN 1 END) as stockouts
      FROM "inventoryLevel" il
      LEFT JOIN "productBasePrice" bp ON bp."productId" = il."productId" AND bp."productVariantId" IS NULL
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
    valueCents: parseFloat(result?.value || '0'),
  };
}

// ============================================================================
// Real-time Metrics
// ============================================================================

export async function getRealTimeMetrics(): Promise<{
  activeUsers: number;
  currentOrders: number;
  revenueTodayCents: number;
  conversionRate: number;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeUsersResult, currentOrdersResult, revenueTodayResult, checkoutStartedResult, checkoutCompletedResult] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT "customerId") as count
       FROM "order"
       WHERE "createdAt" >= $1 AND status IN ('pending', 'processing', 'completed')`,
      [oneHourAgo],
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM "order"
       WHERE "createdAt" >= $1 AND status IN ('pending', 'processing')`,
      [oneHourAgo],
    ),
    queryOne<{ revenue: string }>(
      `SELECT COALESCE(SUM("totalAmountCents"), 0) as revenue
       FROM "order"
       WHERE "createdAt" >= $1 AND status = 'completed'`,
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
    revenueTodayCents: parseFloat(revenueTodayResult?.revenue || '0'),
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
