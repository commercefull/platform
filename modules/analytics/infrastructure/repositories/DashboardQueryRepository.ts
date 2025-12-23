/**
 * Dashboard Query Repository
 * Provides dashboard statistics for admin, merchant, and B2B portals
 */

import { query, queryOne } from '../../../../libs/db';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface RecentOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

export interface TopProduct {
  productId: string;
  name: string;
  totalSold: number;
  revenue: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}

class DashboardQueryRepositoryClass {
  /**
   * Get overall platform dashboard stats (for admin)
   */
  async getAdminDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersResult, revenueResult, customersResult, productsResult, pendingResult, lowStockResult, todayResult] = await Promise.all([
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "order" WHERE "deletedAt" IS NULL`),
      queryOne<{ total: string }>(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total FROM "order" WHERE "deletedAt" IS NULL AND "paymentStatus" = 'paid'`,
      ),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "customer" WHERE "deletedAt" IS NULL`),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "product" WHERE "deletedAt" IS NULL`),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM "order" WHERE "deletedAt" IS NULL AND "status" IN ('pending', 'processing')`,
      ),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "inventoryLevel" WHERE ("quantity" - "reserved") <= "reorderPoint"`),
      queryOne<{ count: string; total: string }>(
        `SELECT COUNT(*) as count, COALESCE(SUM("totalAmount"), 0) as total FROM "order" WHERE "deletedAt" IS NULL AND "createdAt" >= $1`,
        [today],
      ),
    ]);

    return {
      totalOrders: parseInt(ordersResult?.count || '0'),
      totalRevenue: parseFloat(revenueResult?.total || '0'),
      totalCustomers: parseInt(customersResult?.count || '0'),
      totalProducts: parseInt(productsResult?.count || '0'),
      pendingOrders: parseInt(pendingResult?.count || '0'),
      lowStockProducts: parseInt(lowStockResult?.count || '0'),
      todayOrders: parseInt(todayResult?.count || '0'),
      todayRevenue: parseFloat(todayResult?.total || '0'),
    };
  }

  /**
   * Get merchant-specific dashboard stats
   */
  async getMerchantDashboardStats(merchantId: string): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersResult = await queryOne<{ count: string; total: string }>(
      `SELECT COUNT(DISTINCT o."orderId") as count, COALESCE(SUM(oi."totalPrice"), 0) as total
       FROM "order" o
       JOIN "orderItem" oi ON o."orderId" = oi."orderId"
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE p."merchantId" = $1 AND o."deletedAt" IS NULL`,
      [merchantId],
    );

    const todayResult = await queryOne<{ count: string; total: string }>(
      `SELECT COUNT(DISTINCT o."orderId") as count, COALESCE(SUM(oi."totalPrice"), 0) as total
       FROM "order" o
       JOIN "orderItem" oi ON o."orderId" = oi."orderId"
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE p."merchantId" = $1 AND o."deletedAt" IS NULL AND o."createdAt" >= $2`,
      [merchantId, today],
    );

    const productsResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "product" WHERE "merchantId" = $1 AND "deletedAt" IS NULL`,
      [merchantId],
    );

    const pendingResult = await queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT o."orderId") as count
       FROM "order" o
       JOIN "orderItem" oi ON o."orderId" = oi."orderId"
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE p."merchantId" = $1 AND o."deletedAt" IS NULL AND o."status" IN ('pending', 'processing')`,
      [merchantId],
    );

    const lowStockResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM "product" p
       JOIN "inventoryLevel" il ON p."productId" = il."productId"
       WHERE p."merchantId" = $1 AND p."deletedAt" IS NULL AND (il."quantity" - il."reserved") <= il."reorderPoint"`,
      [merchantId],
    );

    return {
      totalOrders: parseInt(ordersResult?.count || '0'),
      totalRevenue: parseFloat(ordersResult?.total || '0'),
      totalCustomers: 0,
      totalProducts: parseInt(productsResult?.count || '0'),
      pendingOrders: parseInt(pendingResult?.count || '0'),
      lowStockProducts: parseInt(lowStockResult?.count || '0'),
      todayOrders: parseInt(todayResult?.count || '0'),
      todayRevenue: parseFloat(todayResult?.total || '0'),
    };
  }

  /**
   * Get recent orders for admin dashboard
   */
  async getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
    const orders = await query<RecentOrder[]>(
      `SELECT 
        o."orderId", o."orderNumber",
        COALESCE(c."firstName" || ' ' || c."lastName", 'Guest') as "customerName",
        o."totalAmount", o."status", o."createdAt"
       FROM "order" o
       LEFT JOIN "customer" c ON o."customerId" = c."customerId"
       WHERE o."deletedAt" IS NULL
       ORDER BY o."createdAt" DESC
       LIMIT $1`,
      [limit],
    );
    return orders || [];
  }

  /**
   * Get recent orders for a specific merchant
   */
  async getMerchantRecentOrders(merchantId: string, limit: number = 5): Promise<RecentOrder[]> {
    const orders = await query<any[]>(
      `SELECT DISTINCT ON (o."orderId")
         o."orderId", o."orderNumber", 
         COALESCE(c."firstName" || ' ' || c."lastName", 'Guest') as "customerName",
         o."totalAmount", o."status", o."createdAt"
       FROM "order" o
       JOIN "orderItem" oi ON o."orderId" = oi."orderId"
       JOIN "product" p ON oi."productId" = p."productId"
       LEFT JOIN "customer" c ON o."customerId" = c."customerId"
       WHERE p."merchantId" = $1 AND o."deletedAt" IS NULL
       ORDER BY o."orderId", o."createdAt" DESC
       LIMIT $2`,
      [merchantId, limit],
    );
    return orders || [];
  }

  /**
   * Get top products for admin dashboard
   */
  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const products = await query<TopProduct[]>(
      `SELECT 
        p."productId", p."name",
        COALESCE(SUM(oi."quantity"), 0)::int as "totalSold",
        COALESCE(SUM(oi."totalPrice"), 0) as "revenue"
       FROM "product" p
       LEFT JOIN "orderItem" oi ON p."productId" = oi."productId"
       WHERE p."deletedAt" IS NULL
       GROUP BY p."productId", p."name"
       ORDER BY "totalSold" DESC
       LIMIT $1`,
      [limit],
    );
    return products || [];
  }

  /**
   * Get top products for a specific merchant
   */
  async getMerchantTopProducts(merchantId: string, limit: number = 5): Promise<TopProduct[]> {
    const products = await query<any[]>(
      `SELECT 
         p."productId", p."name",
         COALESCE(SUM(oi."quantity"), 0)::int as "totalSold",
         COALESCE(SUM(oi."totalPrice"), 0) as "revenue"
       FROM "product" p
       LEFT JOIN "orderItem" oi ON p."productId" = oi."productId"
       WHERE p."merchantId" = $1 AND p."deletedAt" IS NULL
       GROUP BY p."productId", p."name"
       ORDER BY "totalSold" DESC
       LIMIT $2`,
      [merchantId, limit],
    );
    return products || [];
  }

  /**
   * Get revenue by day for charts
   */
  async getRevenueByDay(days: number = 7): Promise<RevenueByDay[]> {
    const result = await query<Array<{ date: string; revenue: string; orders: string }>>(
      `SELECT 
        DATE("createdAt") as date,
        COALESCE(SUM("totalAmount"), 0) as revenue,
        COUNT(*) as orders
       FROM "order"
       WHERE "deletedAt" IS NULL 
         AND "createdAt" >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE("createdAt")
       ORDER BY date ASC`,
    );
    return (result || []).map(r => ({
      date: r.date,
      revenue: parseFloat(r.revenue || '0'),
      orders: parseInt(r.orders || '0'),
    }));
  }
}

export const DashboardQueryRepository = new DashboardQueryRepositoryClass();
export default DashboardQueryRepository;
