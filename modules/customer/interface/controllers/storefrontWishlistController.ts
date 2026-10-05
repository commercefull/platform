import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Storefront Wishlist Controller
 * Manages customer wishlists
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { manageStorefrontWishlistUseCase as manageWishlistUseCase } from '../../application/useCases/wired';

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: View wishlist
 */
export const viewWishlist = async (req: HttpRequest, res: HttpResponse) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return redirectResponse(res, '/signin');
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
export const addToWishlist = async (req: HttpRequest, res: HttpResponse) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return jsonResponse(res, 401, { error: 'Please sign in' });
  }

  const { productId } = req.params;

  const existing = await manageWishlistUseCase.findExisting(user.customerId, productId);

  if (!existing) {
    await manageWishlistUseCase.create(user.customerId, productId);
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return jsonResponse(res, 200, { success: true });
  }
  return redirectResponse(res, '/wishlist');
};

/**
 * POST: Remove item from wishlist
 */
export const removeFromWishlist = async (req: HttpRequest, res: HttpResponse) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return jsonResponse(res, 401, { error: 'Please sign in' });
  }

  const { productId } = req.params;

  await manageWishlistUseCase.remove(user.customerId, productId);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return jsonResponse(res, 200, { success: true });
  }
  return redirectResponse(res, '/wishlist');
};
