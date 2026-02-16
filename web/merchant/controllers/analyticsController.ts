/**
 * Merchant Analytics Controller
 * Merchant-scoped analytics and reporting
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { merchantRespond } from '../../respond';
import { query } from '../../../libs/db';

/**
 * GET: Sales analytics dashboard
 */
export const salesAnalytics = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const period = req.query.period as string || '30d';
    let dateFilter = "NOW() - INTERVAL '30 days'";
    if (period === '7d') dateFilter = "NOW() - INTERVAL '7 days'";
    else if (period === '90d') dateFilter = "NOW() - INTERVAL '90 days'";
    else if (period === '1y') dateFilter = "NOW() - INTERVAL '1 year'";

    const [salesSummary, dailySales, topProducts, ordersByStatus]: any[] = await Promise.all([
      query(
        `SELECT COUNT(*) as "totalOrders", COALESCE(SUM("totalAmount"), 0) as "totalRevenue",
                COALESCE(AVG("totalAmount"), 0) as "avgOrderValue"
         FROM "order" WHERE "merchantId" = $1 AND "createdAt" >= ${dateFilter}`,
        [merchantId],
      ),
      query(
        `SELECT DATE("createdAt") as date, COUNT(*) as orders, COALESCE(SUM("totalAmount"), 0) as revenue
         FROM "order" WHERE "merchantId" = $1 AND "createdAt" >= ${dateFilter}
         GROUP BY DATE("createdAt") ORDER BY date`,
        [merchantId],
      ),
      query(
        `SELECT oi."productId", oi."name", SUM(oi."quantity") as "totalSold",
                SUM(oi."lineTotal") as "totalRevenue"
         FROM "orderItem" oi
         JOIN "order" o ON oi."orderId" = o."orderId"
         WHERE o."merchantId" = $1 AND o."createdAt" >= ${dateFilter}
         GROUP BY oi."productId", oi."name"
         ORDER BY "totalRevenue" DESC LIMIT 10`,
        [merchantId],
      ),
      query(
        `SELECT "status", COUNT(*) as count
         FROM "order" WHERE "merchantId" = $1 AND "createdAt" >= ${dateFilter}
         GROUP BY "status"`,
        [merchantId],
      ),
    ]);

    merchantRespond(req, res, 'analytics/sales', {
      pageName: 'Sales Analytics',
      salesSummary: salesSummary[0] || {},
      dailySales,
      topProducts,
      ordersByStatus,
      period,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load analytics' });
  }
};

/**
 * GET: Product performance analytics
 */
export const productPerformance = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const products = await query(
      `SELECT p."productId", p."name", p."sku", p."status",
              COALESCE(stats."totalSold", 0) as "totalSold",
              COALESCE(stats."totalRevenue", 0) as "totalRevenue",
              COALESCE(inv."quantity", 0) as "currentStock"
       FROM "product" p
       LEFT JOIN (
         SELECT oi."productId", SUM(oi."quantity") as "totalSold", SUM(oi."lineTotal") as "totalRevenue"
         FROM "orderItem" oi
         JOIN "order" o ON oi."orderId" = o."orderId"
         WHERE o."merchantId" = $1
         GROUP BY oi."productId"
       ) stats ON p."productId" = stats."productId"
       LEFT JOIN "inventoryLevel" inv ON p."productId" = inv."productId"
       WHERE p."merchantId" = $1
       ORDER BY "totalRevenue" DESC NULLS LAST`,
      [merchantId],
    );

    merchantRespond(req, res, 'analytics/products', {
      pageName: 'Product Performance',
      products,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load product performance' });
  }
};

/**
 * GET: Customer insights
 */
export const customerInsights = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const [topCustomers, newCustomers, repeatRate]: any[] = await Promise.all([
      query(
        `SELECT o."customerId", o."customerEmail", o."customerName",
                COUNT(*) as "orderCount", SUM(o."totalAmount") as "totalSpent"
         FROM "order" o
         WHERE o."merchantId" = $1 AND o."customerId" IS NOT NULL
         GROUP BY o."customerId", o."customerEmail", o."customerName"
         ORDER BY "totalSpent" DESC LIMIT 20`,
        [merchantId],
      ),
      query(
        `SELECT COUNT(DISTINCT "customerId") as count
         FROM "order"
         WHERE "merchantId" = $1 AND "createdAt" >= NOW() - INTERVAL '30 days'
         AND "customerId" NOT IN (
           SELECT DISTINCT "customerId" FROM "order"
           WHERE "merchantId" = $1 AND "createdAt" < NOW() - INTERVAL '30 days'
           AND "customerId" IS NOT NULL
         )`,
        [merchantId],
      ),
      query(
        `SELECT
           COUNT(DISTINCT CASE WHEN order_count > 1 THEN "customerId" END) as "repeatCustomers",
           COUNT(DISTINCT "customerId") as "totalCustomers"
         FROM (
           SELECT "customerId", COUNT(*) as order_count
           FROM "order" WHERE "merchantId" = $1 AND "customerId" IS NOT NULL
           GROUP BY "customerId"
         ) sub`,
        [merchantId],
      ),
    ]);

    merchantRespond(req, res, 'analytics/customers', {
      pageName: 'Customer Insights',
      topCustomers,
      newCustomers: newCustomers[0] || { count: 0 },
      repeatRate: repeatRate[0] || { repeatCustomers: 0, totalCustomers: 0 },
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load customer insights' });
  }
};
