/**
 * Storefront Return Controller
 * Manages order returns for customers
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { storefrontRespond } from '../../respond';

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: List customer returns
 */
export const listReturns = async (req: Request, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const returns = await query<any[]>(
      `SELECT r.*, o."orderNumber"
       FROM "orderReturn" r
       JOIN "order" o ON r."orderId" = o."orderId"
       WHERE o."customerId" = $1
       ORDER BY r."createdAt" DESC`,
      [user.customerId],
    );

    storefrontRespond(req, res, 'returns/index', {
      pageName: 'My Returns',
      returns: returns || [],
    });
  } catch (error) {
    logger.error('Error loading returns:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load returns',
    });
  }
};

/**
 * GET: Return request form
 */
export const returnRequestForm = async (req: Request, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { orderId } = req.params;

    const order = await queryOne<any>(
      `SELECT * FROM "order"
       WHERE "orderId" = $1 AND "customerId" = $2 AND "deletedAt" IS NULL`,
      [orderId, user.customerId],
    );

    if (!order) {
      return storefrontRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Order not found',
      });
    }

    const items = await query<any[]>(
      `SELECT oi.*, p."name" as "productName", p."sku"
       FROM "orderItem" oi
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE oi."orderId" = $1`,
      [orderId],
    );

    storefrontRespond(req, res, 'returns/create', {
      pageName: 'Request Return',
      order,
      items: items || [],
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load return form',
    });
  }
};

/**
 * POST: Submit return request
 */
export const submitReturnRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { orderId } = req.params;
    const { reason, description, itemIds } = req.body;

    // Verify order belongs to customer
    const order = await queryOne<any>(
      `SELECT "orderId" FROM "order"
       WHERE "orderId" = $1 AND "customerId" = $2 AND "deletedAt" IS NULL`,
      [orderId, user.customerId],
    );

    if (!order) {
      return storefrontRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Order not found',
      });
    }

    const result = await queryOne<any>(
      `INSERT INTO "orderReturn" (
        "orderId", "reason", "description", "status", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, 'requested', NOW(), NOW())
      RETURNING "orderReturnId"`,
      [orderId, reason || 'other', description || null],
    );

    if (result) {
      return res.redirect(`/returns`);
    }

    return res.redirect('/orders');
  } catch (error) {
    logger.error('Error submitting return:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to submit return request',
    });
  }
};

/**
 * GET: View return details
 */
export const viewReturn = async (req: Request, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { returnId } = req.params;

    const returnRequest = await queryOne<any>(
      `SELECT r.*, o."orderNumber"
       FROM "orderReturn" r
       JOIN "order" o ON r."orderId" = o."orderId"
       WHERE r."orderReturnId" = $1 AND o."customerId" = $2`,
      [returnId, user.customerId],
    );

    if (!returnRequest) {
      return storefrontRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Return not found',
      });
    }

    storefrontRespond(req, res, 'returns/view', {
      pageName: `Return #${returnId}`,
      returnRequest,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load return details',
    });
  }
};
