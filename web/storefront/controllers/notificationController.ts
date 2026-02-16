/**
 * Storefront Notification Controller
 * Customer-facing notification pages
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: List customer notifications
 */
export const listNotifications = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM "notification" WHERE "userId" = $1`,
      [customerId],
    );
    const total = parseInt((countResult as any)?.total || '0');

    const notifications = await query(
      `SELECT * FROM "notification"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );

    const unreadCount = await queryOne(
      `SELECT COUNT(*) as count FROM "notification" WHERE "userId" = $1 AND "readAt" IS NULL`,
      [customerId],
    );

    const totalPages = Math.ceil(total / limit);

    storefrontRespond(req, res, 'notifications/list', {
      pageName: 'Notifications',
      notifications,
      unreadCount: parseInt((unreadCount as any)?.count || '0'),
      pagination: { page, totalPages, total, limit },
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load notifications' });
  }
};

/**
 * POST: Mark notification as read
 */
export const markAsRead = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { notificationId } = req.params;

    await query(
      `UPDATE "notification" SET "readAt" = NOW() WHERE "notificationId" = $1 AND "userId" = $2`,
      [notificationId, customerId],
    );

    // If AJAX request, return JSON
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true });
      return;
    }

    res.redirect('/notifications');
  } catch (error) {
    logger.error('Error:', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
      return;
    }
    res.redirect('/notifications');
  }
};

/**
 * POST: Mark all notifications as read
 */
export const markAllAsRead = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    await query(
      `UPDATE "notification" SET "readAt" = NOW() WHERE "userId" = $1 AND "readAt" IS NULL`,
      [customerId],
    );

    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true });
      return;
    }

    (req as any).flash?.('success', 'All notifications marked as read');
    res.redirect('/notifications');
  } catch (error) {
    logger.error('Error:', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
      return;
    }
    res.redirect('/notifications');
  }
};

/**
 * GET: Notification preferences
 */
export const getPreferences = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const preferences = await queryOne(
      `SELECT * FROM "notificationPreference" WHERE "userId" = $1`,
      [customerId],
    );

    storefrontRespond(req, res, 'notifications/preferences', {
      pageName: 'Notification Preferences',
      preferences: preferences || {},
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load preferences' });
  }
};

/**
 * POST: Update notification preferences
 */
export const updatePreferences = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { emailOrderUpdates, emailPromotions, emailNewsletter, pushEnabled } = req.body;

    await query(
      `INSERT INTO "notificationPreference" ("userId", "emailOrderUpdates", "emailPromotions", "emailNewsletter", "pushEnabled", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT ("userId") DO UPDATE SET
         "emailOrderUpdates" = $2, "emailPromotions" = $3, "emailNewsletter" = $4,
         "pushEnabled" = $5, "updatedAt" = NOW()`,
      [customerId, !!emailOrderUpdates, !!emailPromotions, !!emailNewsletter, !!pushEnabled],
    );

    (req as any).flash?.('success', 'Notification preferences updated');
    res.redirect('/notifications/preferences');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to update preferences');
    res.redirect('/notifications/preferences');
  }
};
