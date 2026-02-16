/**
 * Merchant Fulfillment Controller
 * Merchant-scoped order fulfillment management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { merchantRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: List fulfillments for merchant's orders
 */
export const listFulfillments = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const page = parseInt(req.query.page as string) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;
    const status = req.query.status as string || '';

    let whereClause = 'WHERE f."merchantId" = $1';
    const params: any[] = [merchantId];
    let paramIdx = 2;

    if (status) {
      whereClause += ` AND f."status" = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM "fulfillment" f ${whereClause}`,
      params,
    );
    const total = parseInt((countResult as any)?.total || '0');

    const fulfillments = await query(
      `SELECT f.*, o."orderNumber"
       FROM "fulfillment" f
       LEFT JOIN "order" o ON f."orderId" = o."orderId"
       ${whereClause}
       ORDER BY f."createdAt" DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset],
    );

    const totalPages = Math.ceil(total / limit);

    merchantRespond(req, res, 'fulfillment/list', {
      pageName: 'Fulfillments',
      fulfillments,
      pagination: { page, totalPages, total, limit },
      status,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load fulfillments' });
  }
};

/**
 * GET: View fulfillment details
 */
export const viewFulfillment = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { fulfillmentId } = req.params;

    const fulfillment = await queryOne(
      `SELECT f.*, o."orderNumber", o."customerEmail"
       FROM "fulfillment" f
       LEFT JOIN "order" o ON f."orderId" = o."orderId"
       WHERE f."fulfillmentId" = $1 AND f."merchantId" = $2`,
      [fulfillmentId, merchantId],
    );

    if (!fulfillment) {
      (req as any).flash?.('error', 'Fulfillment not found');
      return res.redirect('/merchant/fulfillments');
    }

    const items = await query(
      `SELECT fi.* FROM "fulfillmentItem" fi WHERE fi."fulfillmentId" = $1`,
      [fulfillmentId],
    );

    merchantRespond(req, res, 'fulfillment/view', {
      pageName: `Fulfillment Details`,
      fulfillment,
      items,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load fulfillment' });
  }
};

/**
 * POST: Update fulfillment tracking
 */
export const updateTracking = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { fulfillmentId } = req.params;
    const { trackingNumber, trackingUrl, carrier } = req.body;

    const fulfillment = await queryOne(
      `SELECT * FROM "fulfillment" WHERE "fulfillmentId" = $1 AND "merchantId" = $2`,
      [fulfillmentId, merchantId],
    );

    if (!fulfillment) {
      (req as any).flash?.('error', 'Fulfillment not found');
      return res.redirect('/merchant/fulfillments');
    }

    await query(
      `UPDATE "fulfillment"
       SET "trackingNumber" = $1, "trackingUrl" = $2, "carrier" = $3, "updatedAt" = NOW()
       WHERE "fulfillmentId" = $4`,
      [trackingNumber, trackingUrl, carrier, fulfillmentId],
    );

    (req as any).flash?.('success', 'Tracking information updated');
    res.redirect(`/merchant/fulfillments/${fulfillmentId}`);
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to update tracking');
    res.redirect('/merchant/fulfillments');
  }
};

/**
 * POST: Mark fulfillment as shipped
 */
export const markAsShipped = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { fulfillmentId } = req.params;

    await query(
      `UPDATE "fulfillment"
       SET "status" = 'shipped', "shippedAt" = NOW(), "updatedAt" = NOW()
       WHERE "fulfillmentId" = $1 AND "merchantId" = $2`,
      [fulfillmentId, merchantId],
    );

    (req as any).flash?.('success', 'Fulfillment marked as shipped');
    res.redirect(`/merchant/fulfillments/${fulfillmentId}`);
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to update fulfillment');
    res.redirect('/merchant/fulfillments');
  }
};

/**
 * POST: Mark fulfillment as delivered
 */
export const markAsDelivered = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { fulfillmentId } = req.params;

    await query(
      `UPDATE "fulfillment"
       SET "status" = 'delivered', "deliveredAt" = NOW(), "updatedAt" = NOW()
       WHERE "fulfillmentId" = $1 AND "merchantId" = $2`,
      [fulfillmentId, merchantId],
    );

    (req as any).flash?.('success', 'Fulfillment marked as delivered');
    res.redirect(`/merchant/fulfillments/${fulfillmentId}`);
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to update fulfillment');
    res.redirect('/merchant/fulfillments');
  }
};
