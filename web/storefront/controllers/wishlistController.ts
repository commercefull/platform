/**
 * Storefront Wishlist Controller
 * Manages customer wishlists
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
 * GET: View wishlist
 */
export const viewWishlist = async (req: Request, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const items = await query<any[]>(
      `SELECT w.*, p."name", p."price", p."sku", p."status",
              pm."url" as "imageUrl"
       FROM "wishlistItem" w
       JOIN "product" p ON w."productId" = p."productId"
       LEFT JOIN "productMedia" pm ON p."productId" = pm."productId" AND pm."isPrimary" = true
       WHERE w."customerId" = $1
       ORDER BY w."createdAt" DESC`,
      [user.customerId],
    );

    storefrontRespond(req, res, 'wishlist/index', {
      pageName: 'My Wishlist',
      items: items || [],
    });
  } catch (error) {
    logger.error('Error loading wishlist:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load wishlist',
    });
  }
};

/**
 * POST: Add item to wishlist
 */
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.status(401).json({ error: 'Please sign in' });
    }

    const { productId } = req.params;

    // Check if already in wishlist
    const existing = await queryOne<any>(
      `SELECT "wishlistItemId" FROM "wishlistItem" WHERE "customerId" = $1 AND "productId" = $2`,
      [user.customerId, productId],
    );

    if (!existing) {
      await queryOne<any>(
        `INSERT INTO "wishlistItem" ("customerId", "productId", "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW()) RETURNING "wishlistItemId"`,
        [user.customerId, productId],
      );
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true });
    }
    return res.redirect('/wishlist');
  } catch (error) {
    logger.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
};

/**
 * POST: Remove item from wishlist
 */
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.status(401).json({ error: 'Please sign in' });
    }

    const { productId } = req.params;

    await queryOne<any>(
      `DELETE FROM "wishlistItem" WHERE "customerId" = $1 AND "productId" = $2 RETURNING "wishlistItemId"`,
      [user.customerId, productId],
    );

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true });
    }
    return res.redirect('/wishlist');
  } catch (error) {
    logger.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
};
