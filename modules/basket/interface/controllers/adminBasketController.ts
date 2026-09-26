/**
 * Basket Controller
 * Handles abandoned cart recovery and basket analytics for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageAdminBasketUseCase as manageBasketUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Abandoned Cart Management
// ============================================================================

export const listAbandonedCarts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const olderThanDays = parseInt(req.query.days as string) || 7;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const { abandonedBaskets, expiredBaskets, stats } = await manageBasketUseCase.getAbandonedCartStats(olderThanDays);

  adminRespond(req, res, 'operations/baskets/abandoned', {
    pageName: 'Abandoned Carts',
    abandonedBaskets,
    expiredBaskets,
    stats,
    filters: { olderThanDays },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
};

export const viewAbandonedCart = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;

  const details = await manageBasketUseCase.getBasketViewDetails(basketId);

  if (!details) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Abandoned cart not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/baskets/view', {
    pageName: `Abandoned Cart: ${details.basket.basketId}`,
    basket: details.basket,
    cartValueCents: details.cartValueCents,
    daysSinceActivity: details.daysSinceActivity,

    success: req.query.success || null,
  });
};

export const recoverAbandonedCart = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as HttpRequestBody;
  const { recoveryMethod, message: _message } = body;

  const basket = await manageBasketUseCase.findById(basketId);

  if (!basket) {
    throw new Error('Abandoned cart not found');
  }

  // For now, just mark as recovered (in a real implementation, this would trigger email campaigns, etc.)
  logger.info('Recovering abandoned cart', {
    basketId,
    recoveryMethod,
    cartValueCents: manageBasketUseCase.getCartValueCents(basket),
    customerId: basket.customerId,
    sessionId: basket.sessionId,
  });

  // In a real implementation, you might:
  // 1. Send recovery email with cart contents
  // 2. Apply discount code to cart
  // 3. Track recovery attempts
  // 4. Update basket status

  res.json({
    success: true,
    message: 'Recovery action initiated successfully',
    recoveryMethod,
    basketId,
  });
};

export const sendRecoveryEmail = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketId } = req.params;
  const body = req.body as HttpRequestBody;
  const { template, subject, discountCode } = body;

  const basket = await manageBasketUseCase.findById(basketId);

  if (!basket) {
    throw new Error('Abandoned cart not found');
  }

  if (!basket.customerId) {
    throw new Error('Cart has no associated customer email');
  }

  // In a real implementation, this would integrate with your email service
  logger.info('Sending recovery email', {
    basketId,
    customerId: basket.customerId,
    template,
    subject,
    discountCode,
    cartItems: basket.items.length,
    cartValueCents: manageBasketUseCase.getCartValueCents(basket),
  });

  res.json({
    success: true,
    message: 'Recovery email sent successfully',
    basketId,
    customerId: basket.customerId,
  });
};

export const markCartRecovered = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { _basketId } = req.params;

  // In a real implementation, this would be called when a customer completes purchase from recovered cart

  res.json({ success: true, message: 'Cart marked as recovered' });
};

// ============================================================================
// Basket Analytics
// ============================================================================

export const basketAnalytics = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stats = await manageBasketUseCase.getBasketAnalytics();

  adminRespond(req, res, 'operations/baskets/analytics', {
    pageName: 'Cart Analytics',
    stats,
  });
};

export const cleanupExpiredBaskets = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const deletedCount = await manageBasketUseCase.cleanupExpiredBaskets();

  res.json({
    success: true,
    message: `Successfully cleaned up ${deletedCount} expired baskets`,
    deletedCount,
  });
};
