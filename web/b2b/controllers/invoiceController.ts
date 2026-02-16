/**
 * B2B Invoice Controller
 * Company-scoped invoice management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { b2bRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: List invoices for the company
 */
export const listInvoices = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const page = parseInt(req.query.page as string) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;
    const status = req.query.status as string || '';

    let whereClause = 'WHERE o."b2bCompanyId" = $1';
    const params: any[] = [companyId];
    let paramIdx = 2;

    if (status) {
      whereClause += ` AND o."paymentStatus" = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM "order" o ${whereClause}`,
      params,
    );
    const total = parseInt((countResult as any)?.total || '0');

    const invoices = await query(
      `SELECT o."orderId", o."orderNumber", o."totalAmount", o."currencyCode",
              o."paymentStatus", o."createdAt", o."customerName", o."customerEmail"
       FROM "order" o
       ${whereClause}
       ORDER BY o."createdAt" DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset],
    );

    const totalPages = Math.ceil(total / limit);

    b2bRespond(req, res, 'invoices/list', {
      pageName: 'Invoices',
      invoices,
      pagination: { page, totalPages, total, limit },
      status,
    });
  } catch (error) {
    logger.error('Error:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load invoices' });
  }
};

/**
 * GET: View invoice detail
 */
export const viewInvoice = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const { orderId } = req.params;

    const order = await queryOne(
      `SELECT o.* FROM "order" o WHERE o."orderId" = $1 AND o."b2bCompanyId" = $2`,
      [orderId, companyId],
    );

    if (!order) {
      (req as any).flash?.('error', 'Invoice not found');
      return res.redirect('/b2b/invoices');
    }

    const items = await query(
      `SELECT * FROM "orderItem" WHERE "orderId" = $1`,
      [orderId],
    );

    const payments = await query(
      `SELECT * FROM "paymentTransaction" WHERE "orderId" = $1 ORDER BY "createdAt" DESC`,
      [orderId],
    );

    b2bRespond(req, res, 'invoices/view', {
      pageName: `Invoice #${(order as any).orderNumber}`,
      order,
      items,
      payments,
    });
  } catch (error) {
    logger.error('Error:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load invoice' });
  }
};
