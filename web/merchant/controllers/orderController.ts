/**
 * Merchant Order Controller
 * Manages orders with merchant isolation
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';

interface MerchantUser {
  id: string;
  merchantId: string;
  email: string;
  name: string;
}

/**
 * GET: List merchant's orders
 */
export const listOrders = async (req: Request, res: Response) => {
  try {
    const user = req.user as MerchantUser;
    if (!user?.merchantId) {
      return res.redirect('/merchant/login');
    }

    const { status, paymentStatus, search, page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    let whereClause = 'WHERE p."merchantId" = $1 AND o."deletedAt" IS NULL';
    const params: any[] = [user.merchantId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND o."status" = $${paramIndex++}`;
      params.push(status);
    }

    if (paymentStatus) {
      whereClause += ` AND o."paymentStatus" = $${paramIndex++}`;
      params.push(paymentStatus);
    }

    if (search) {
      whereClause += ` AND o."orderNumber" ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count distinct orders
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT o."orderId") as count 
       FROM "order" o
       JOIN "orderItem" oi ON o."orderId" = oi."orderId"
       JOIN "product" p ON oi."productId" = p."productId"
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    // Get orders with merchant's items
    params.push(limit, offset);
    const orders = await query<any[]>(
      `SELECT DISTINCT ON (o."orderId")
         o."orderId", o."orderNumber", o."status", o."paymentStatus", 
         o."fulfillmentStatus", o."totalAmount", o."createdAt",
         COALESCE(c."firstName" || ' ' || c."lastName", 'Guest') as "customerName",
         (SELECT COUNT(*) FROM "orderItem" oi2 
          JOIN "product" p2 ON oi2."productId" = p2."productId" 
          WHERE oi2."orderId" = o."orderId" AND p2."merchantId" = $1) as "itemCount",
         (SELECT COALESCE(SUM(oi2."totalPrice"), 0) FROM "orderItem" oi2 
          JOIN "product" p2 ON oi2."productId" = p2."productId" 
          WHERE oi2."orderId" = o."orderId" AND p2."merchantId" = $1) as "merchantTotal"
       FROM "order" o
       JOIN "orderItem" oi ON o."orderId" = oi."orderId"
       JOIN "product" p ON oi."productId" = p."productId"
       LEFT JOIN "customer" c ON o."customerId" = c."customerId"
       ${whereClause}
       ORDER BY o."orderId", o."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    res.render('merchant/views/orders/index', {
      pageName: 'Orders',
      user,
      orders: orders || [],
      pagination: {
        total,
        page: currentPage,
        pages,
        hasNext: currentPage < pages,
        hasPrev: currentPage > 1,
      },
      filters: { status, paymentStatus, search },
    });
  } catch (error) {
    console.error('Merchant orders error:', error);
    res.status(500).render('merchant/views/error', {
      pageName: 'Error',
      error: 'Failed to load orders',
      user: req.user,
    });
  }
};

/**
 * GET: View single order
 */
export const viewOrder = async (req: Request, res: Response) => {
  try {
    const user = req.user as MerchantUser;
    if (!user?.merchantId) {
      return res.redirect('/merchant/login');
    }

    const { orderId } = req.params;

    // Check if order contains merchant's products
    const orderCheck = await queryOne<any>(
      `SELECT o.*, 
              COALESCE(c."firstName" || ' ' || c."lastName", 'Guest') as "customerName",
              c."email" as "customerEmail"
       FROM "order" o
       LEFT JOIN "customer" c ON o."customerId" = c."customerId"
       WHERE o."orderId" = $1 AND o."deletedAt" IS NULL
         AND EXISTS (
           SELECT 1 FROM "orderItem" oi 
           JOIN "product" p ON oi."productId" = p."productId"
           WHERE oi."orderId" = o."orderId" AND p."merchantId" = $2
         )`,
      [orderId, user.merchantId]
    );

    if (!orderCheck) {
      return res.status(404).render('merchant/views/error', {
        pageName: 'Not Found',
        error: 'Order not found',
        user,
      });
    }

    // Get only merchant's items from this order
    const items = await query<any[]>(
      `SELECT oi.*, p."name" as "productName", p."sku"
       FROM "orderItem" oi
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE oi."orderId" = $1 AND p."merchantId" = $2`,
      [orderId, user.merchantId]
    );

    res.render('merchant/views/orders/view', {
      pageName: `Order ${orderCheck.orderNumber}`,
      user,
      order: orderCheck,
      items: items || [],
    });
  } catch (error) {
    console.error('Merchant view order error:', error);
    res.status(500).render('merchant/views/error', {
      pageName: 'Error',
      error: 'Failed to load order',
      user: req.user,
    });
  }
};
