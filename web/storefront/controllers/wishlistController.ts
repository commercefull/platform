/**
 * Storefront Wishlist Controller
 * Manages customer wishlists
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import * as storefrontWishlistRepo from '../../../modules/customer/infrastructure/repositories/storefrontWishlistRepo';

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: View wishlist
 */
export const viewWishlist = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const items = await storefrontWishlistRepo.findByCustomer(user.customerId);

    storefrontRespond(req, res, 'wishlist/index', {
      pageName: 'My Wishlist',
      items,
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
export const addToWishlist = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.status(401).json({ error: 'Please sign in' });
    }

    const { productId } = req.params;

    const existing = await storefrontWishlistRepo.findExisting(user.customerId, productId);

    if (!existing) {
      await storefrontWishlistRepo.create(user.customerId, productId);
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
export const removeFromWishlist = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.status(401).json({ error: 'Please sign in' });
    }

    const { productId } = req.params;

    await storefrontWishlistRepo.remove(user.customerId, productId);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true });
    }
    return res.redirect('/wishlist');
  } catch (error) {
    logger.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
};
