/**
 * Storefront Wishlist Controller
 * Manages customer wishlists
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { ManageStorefrontWishlistUseCase } from '../../../modules/customer/application/useCases/ManageStorefrontWishlist';

const manageWishlistUseCase = new ManageStorefrontWishlistUseCase();

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: View wishlist
 */
export const viewWishlist = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const items = await manageWishlistUseCase.findByCustomer(user.customerId);

  storefrontRespond(req, res, 'wishlist/index', {
    pageName: 'My Wishlist',
    items,
  });
  
};

/**
 * POST: Add item to wishlist
 */
export const addToWishlist = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.status(401).json({ error: 'Please sign in' });
  }

  const { productId } = req.params;

  const existing = await manageWishlistUseCase.findExisting(user.customerId, productId);

  if (!existing) {
    await manageWishlistUseCase.create(user.customerId, productId);
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true });
  }
  return res.redirect('/wishlist');
  
};

/**
 * POST: Remove item from wishlist
 */
export const removeFromWishlist = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.status(401).json({ error: 'Please sign in' });
  }

  const { productId } = req.params;

  await manageWishlistUseCase.remove(user.customerId, productId);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true });
  }
  return res.redirect('/wishlist');
  
};
