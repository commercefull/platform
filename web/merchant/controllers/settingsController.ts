/**
 * Merchant Settings Controller
 * Merchant profile and store settings management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { merchantRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: Merchant profile settings
 */
export const getProfile = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const merchant = await queryOne(
      `SELECT * FROM "merchant" WHERE "merchantId" = $1`,
      [merchantId],
    );

    merchantRespond(req, res, 'settings/profile', {
      pageName: 'Profile Settings',
      merchant,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load profile' });
  }
};

/**
 * POST: Update merchant profile
 */
export const updateProfile = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { businessName, contactEmail, contactPhone, website, description, address, city, state, postalCode, country } = req.body;

    await query(
      `UPDATE "merchant"
       SET "businessName" = $1, "contactEmail" = $2, "contactPhone" = $3,
           "website" = $4, "description" = $5, "address" = $6, "city" = $7,
           "state" = $8, "postalCode" = $9, "country" = $10, "updatedAt" = NOW()
       WHERE "merchantId" = $11`,
      [businessName, contactEmail, contactPhone, website, description, address, city, state, postalCode, country, merchantId],
    );

    (req as any).flash?.('success', 'Profile updated successfully');
    res.redirect('/merchant/settings/profile');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to update profile');
    res.redirect('/merchant/settings/profile');
  }
};

/**
 * GET: Store settings (shipping, payment, etc.)
 */
export const getStoreSettings = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const [shippingMethods, paymentMethods] = await Promise.all([
      query(
        `SELECT * FROM "shippingMethod" WHERE "merchantId" = $1 ORDER BY "name"`,
        [merchantId],
      ),
      query(
        `SELECT * FROM "paymentMethod" WHERE "merchantId" = $1 ORDER BY "name"`,
        [merchantId],
      ),
    ]);

    merchantRespond(req, res, 'settings/store', {
      pageName: 'Store Settings',
      shippingMethods,
      paymentMethods,
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load store settings' });
  }
};

/**
 * GET: Notification preferences
 */
export const getNotificationSettings = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const preferences = await queryOne(
      `SELECT * FROM "merchantNotificationPreference" WHERE "merchantId" = $1`,
      [merchantId],
    );

    merchantRespond(req, res, 'settings/notifications', {
      pageName: 'Notification Settings',
      preferences: preferences || {},
    });
  } catch (error) {
    logger.error('Error:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load notification settings' });
  }
};

/**
 * POST: Update notification preferences
 */
export const updateNotificationSettings = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { emailOnNewOrder, emailOnLowStock, emailOnReturn, emailDigestFrequency } = req.body;

    await query(
      `INSERT INTO "merchantNotificationPreference" ("merchantId", "emailOnNewOrder", "emailOnLowStock", "emailOnReturn", "emailDigestFrequency", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT ("merchantId") DO UPDATE SET
         "emailOnNewOrder" = $2, "emailOnLowStock" = $3, "emailOnReturn" = $4,
         "emailDigestFrequency" = $5, "updatedAt" = NOW()`,
      [merchantId, !!emailOnNewOrder, !!emailOnLowStock, !!emailOnReturn, emailDigestFrequency || 'daily'],
    );

    (req as any).flash?.('success', 'Notification settings updated');
    res.redirect('/merchant/settings/notifications');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to update notification settings');
    res.redirect('/merchant/settings/notifications');
  }
};
