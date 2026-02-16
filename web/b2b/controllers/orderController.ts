/**
 * B2B Order Controller
 * Manages orders with company isolation
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { query, queryOne } from '../../../libs/db';
import { b2bRespond } from '../../respond';

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
export const listOrders = async (req: TypedRequest, res: Response) => {
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

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "order" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    params.push(limit, offset);
    const orders = await query<any[]>(
      `SELECT "orderId", "orderNumber", "totalAmount", "status", 
              "paymentStatus", "fulfillmentStatus", "createdAt"
       FROM "order"
       ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params,
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    b2bRespond(req, res, 'orders/index', {
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
    logger.error('Error:', error);

    b2bRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load orders',
      user: req.user,
    });
  }
};

/**
 * GET: View single order
 */
export const viewOrder = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { orderId } = req.params;

    const order = await queryOne<any>(
      `SELECT * FROM "order"
       WHERE "orderId" = $1 AND "b2bCompanyId" = $2 AND "deletedAt" IS NULL`,
      [orderId, user.companyId],
    );

    if (!order) {
      return b2bRespond(req, res, 'error', {
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
      [orderId],
    );

    b2bRespond(req, res, 'orders/view', {
      pageName: `Order ${order.orderNumber}`,
      user,
      order,
      items: items || [],
    });
  } catch (error) {
    logger.error('Error:', error);

    b2bRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load order',
      user: req.user,
    });
  }
};

/**
 * GET: Reorder from previous order
 */
export const reorderForm = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { orderId } = req.params;

    const order = await queryOne<any>(
      `SELECT * FROM "order"
       WHERE "orderId" = $1 AND "b2bCompanyId" = $2 AND "deletedAt" IS NULL`,
      [orderId, user.companyId],
    );

    if (!order) {
      return b2bRespond(req, res, 'error', {
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
      [orderId],
    );

    b2bRespond(req, res, 'orders/reorder', {
      pageName: 'Reorder',
      user,
      originalOrder: order,
      items: items || [],
    });
  } catch (error) {
    logger.error('Error:', error);

    b2bRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load reorder form',
      user: req.user,
    });
  }
};

/**
 * POST: Submit reorder (creates a new order from previous order items)
 */
export const submitReorder = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { orderId } = req.params;
    const { items } = req.body;

    // Verify original order belongs to company
    const originalOrder = await queryOne<any>(
      `SELECT * FROM "order"
       WHERE "orderId" = $1 AND "b2bCompanyId" = $2 AND "deletedAt" IS NULL`,
      [orderId, user.companyId],
    );

    if (!originalOrder) {
      return b2bRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Original order not found',
        user,
      });
    }

    // Create new order based on original
    const newOrder = await queryOne<any>(
      `INSERT INTO "order" (
        "b2bCompanyId", "customerId", "status", "paymentStatus", "fulfillmentStatus",
        "shippingAddressId", "billingAddressId", "notes",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, 'pending', 'pending', 'unfulfilled', $3, $4, $5, NOW(), NOW())
      RETURNING "orderId", "orderNumber"`,
      [
        user.companyId,
        originalOrder.customerId,
        originalOrder.shippingAddressId,
        originalOrder.billingAddressId,
        `Reorder from ${originalOrder.orderNumber}`,
      ],
    );

    if (newOrder) {
      return res.redirect(`/b2b/orders/${newOrder.orderId}`);
    }

    return res.redirect('/b2b/orders');
  } catch (error) {
    logger.error('Error submitting reorder:', error);

    b2bRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to submit reorder',
      user: req.user,
    });
  }
};
