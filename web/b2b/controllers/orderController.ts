/**
 * B2B Order Controller
 * Manages orders with company isolation
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';

interface B2BUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * GET: List company's orders
 */
export const listOrders = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { status, page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    let whereClause = 'WHERE "b2bCompanyId" = $1 AND "deletedAt" IS NULL';
    const params: any[] = [user.companyId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND "status" = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "order" ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    params.push(limit, offset);
    const orders = await query<any[]>(
      `SELECT "orderId", "orderNumber", "totalAmount", "status", 
              "paymentStatus", "fulfillmentStatus", "createdAt"
       FROM "order"
       ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    res.render('b2b/views/orders/index', {
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
      filters: { status },
    });
  } catch (error) {
    console.error('B2B orders error:', error);
    res.status(500).render('b2b/views/error', {
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
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { orderId } = req.params;

    const order = await queryOne<any>(
      `SELECT * FROM "order"
       WHERE "orderId" = $1 AND "b2bCompanyId" = $2 AND "deletedAt" IS NULL`,
      [orderId, user.companyId]
    );

    if (!order) {
      return res.status(404).render('b2b/views/error', {
        pageName: 'Not Found',
        error: 'Order not found',
        user,
      });
    }

    const items = await query<any[]>(
      `SELECT oi.*, p."name" as "productName", p."sku"
       FROM "orderItem" oi
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE oi."orderId" = $1`,
      [orderId]
    );

    res.render('b2b/views/orders/view', {
      pageName: `Order ${order.orderNumber}`,
      user,
      order,
      items: items || [],
    });
  } catch (error) {
    console.error('B2B view order error:', error);
    res.status(500).render('b2b/views/error', {
      pageName: 'Error',
      error: 'Failed to load order',
      user: req.user,
    });
  }
};

/**
 * GET: Reorder from previous order
 */
export const reorderForm = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { orderId } = req.params;

    const order = await queryOne<any>(
      `SELECT * FROM "order"
       WHERE "orderId" = $1 AND "b2bCompanyId" = $2 AND "deletedAt" IS NULL`,
      [orderId, user.companyId]
    );

    if (!order) {
      return res.status(404).render('b2b/views/error', {
        pageName: 'Not Found',
        error: 'Order not found',
        user,
      });
    }

    const items = await query<any[]>(
      `SELECT oi.*, p."name" as "productName", p."sku", p."price" as "currentPrice"
       FROM "orderItem" oi
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE oi."orderId" = $1 AND p."status" = 'active'`,
      [orderId]
    );

    res.render('b2b/views/orders/reorder', {
      pageName: 'Reorder',
      user,
      originalOrder: order,
      items: items || [],
    });
  } catch (error) {
    console.error('B2B reorder error:', error);
    res.status(500).render('b2b/views/error', {
      pageName: 'Error',
      error: 'Failed to load reorder form',
      user: req.user,
    });
  }
};
