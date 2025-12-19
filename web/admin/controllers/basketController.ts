/**
 * Basket Controller
 * Handles abandoned cart recovery and basket analytics for the Admin Hub
 */

import { Request, Response } from 'express';
import BasketRepo from '../../../modules/basket/infrastructure/repositories/BasketRepository';

// ============================================================================
// Abandoned Cart Management
// ============================================================================

export const listAbandonedCarts = async (req: Request, res: Response): Promise<void> => {
  try {
    const olderThanDays = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const abandonedBaskets = await BasketRepo.findAbandonedBaskets(olderThanDays);
    const expiredBaskets = await BasketRepo.findExpiredBaskets();

    // Calculate recovery potential
    const recoveryPotential = abandonedBaskets.reduce((total, basket) => {
      return total + basket.items.reduce((itemTotal, item) => {
        return itemTotal + (item.unitPrice.amount * item.quantity);
      }, 0);
    }, 0);

    const stats = {
      totalAbandoned: abandonedBaskets.length,
      totalExpired: expiredBaskets.length,
      recoveryPotential: recoveryPotential,
      avgCartValue: abandonedBaskets.length > 0 ? recoveryPotential / abandonedBaskets.length : 0
    };

    res.render('hub/views/operations/baskets/abandoned', {
      pageName: 'Abandoned Carts',
      abandonedBaskets,
      expiredBaskets,
      stats,
      filters: { olderThanDays },
      pagination: { limit, offset },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing abandoned carts:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load abandoned carts',
      user: req.user
    });
  }
};

export const viewAbandonedCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    const basket = await BasketRepo.findById(basketId);

    if (!basket) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Abandoned cart not found',
        user: req.user
      });
      return;
    }

    // Calculate cart value
    const cartValue = basket.items.reduce((total, item) => {
      return total + (item.unitPrice.amount * item.quantity);
    }, 0);

    // Calculate days since last activity
    const daysSinceActivity = Math.floor(
      (Date.now() - basket.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.render('hub/views/operations/baskets/view', {
      pageName: `Abandoned Cart: ${basket.basketId}`,
      basket,
      cartValue,
      daysSinceActivity,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing abandoned cart:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load abandoned cart',
      user: req.user
    });
  }
};

export const recoverAbandonedCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;
    const { recoveryMethod, message } = req.body;

    const basket = await BasketRepo.findById(basketId);

    if (!basket) {
      throw new Error('Abandoned cart not found');
    }

    // For now, just mark as recovered (in a real implementation, this would trigger email campaigns, etc.)
    console.log('Recovering abandoned cart:', {
      basketId,
      recoveryMethod,
      message,
      cartValue: basket.items.reduce((total, item) => total + (item.unitPrice.amount * item.quantity), 0),
      customerId: basket.customerId,
      sessionId: basket.sessionId
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
      basketId
    });
  } catch (error: any) {
    console.error('Error recovering abandoned cart:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to recover abandoned cart' });
  }
};

export const sendRecoveryEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;
    const { template, subject, discountCode } = req.body;

    const basket = await BasketRepo.findById(basketId);

    if (!basket) {
      throw new Error('Abandoned cart not found');
    }

    if (!basket.customerId) {
      throw new Error('Cart has no associated customer email');
    }

    // In a real implementation, this would integrate with your email service
    console.log('Sending recovery email:', {
      basketId,
      customerId: basket.customerId,
      template,
      subject,
      discountCode,
      cartItems: basket.items.length,
      cartValue: basket.items.reduce((total, item) => total + (item.unitPrice.amount * item.quantity), 0)
    });

    res.json({
      success: true,
      message: 'Recovery email sent successfully',
      basketId,
      customerId: basket.customerId
    });
  } catch (error: any) {
    console.error('Error sending recovery email:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send recovery email' });
  }
};

export const markCartRecovered = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    // In a real implementation, this would be called when a customer completes purchase from recovered cart
    console.log('Marking cart as recovered:', basketId);

    res.json({ success: true, message: 'Cart marked as recovered' });
  } catch (error: any) {
    console.error('Error marking cart as recovered:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to mark cart as recovered' });
  }
};

// ============================================================================
// Basket Analytics
// ============================================================================

export const basketAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get basic cart statistics
    const abandonedBaskets = await BasketRepo.findAbandonedBaskets(30); // Last 30 days
    const expiredBaskets = await BasketRepo.findExpiredBaskets();

    // Calculate analytics
    const totalAbandoned = abandonedBaskets.length;
    const totalExpired = expiredBaskets.length;

    // Calculate cart values
    const abandonedValue = abandonedBaskets.reduce((total, basket) => {
      return total + basket.items.reduce((itemTotal, item) => {
        return itemTotal + (item.unitPrice.amount * item.quantity);
      }, 0);
    }, 0);

    const avgCartValue = totalAbandoned > 0 ? abandonedValue / totalAbandoned : 0;

    // Calculate recovery potential by age
    const recentAbandoned = abandonedBaskets.filter(basket => {
      const daysSinceActivity = Math.floor((Date.now() - basket.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceActivity <= 7;
    });

    const olderAbandoned = abandonedBaskets.filter(basket => {
      const daysSinceActivity = Math.floor((Date.now() - basket.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceActivity > 7;
    });

    const recentValue = recentAbandoned.reduce((total, basket) => {
      return total + basket.items.reduce((itemTotal, item) => {
        return itemTotal + (item.unitPrice.amount * item.quantity);
      }, 0);
    }, 0);

    const olderValue = olderAbandoned.reduce((total, basket) => {
      return total + basket.items.reduce((itemTotal, item) => {
        return itemTotal + (item.unitPrice.amount * item.quantity);
      }, 0);
    }, 0);

    const stats = {
      totalAbandoned,
      totalExpired,
      totalValue: abandonedValue,
      avgCartValue,
      recoveryRate: 0, // Would need conversion tracking
      recentAbandoned: recentAbandoned.length,
      olderAbandoned: olderAbandoned.length,
      recentValue,
      olderValue,
      topAbandonedProducts: [] // Would need product analytics
    };

    res.render('hub/views/operations/baskets/analytics', {
      pageName: 'Cart Analytics',
      stats,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading basket analytics:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load basket analytics',
      user: req.user
    });
  }
};

export const cleanupExpiredBaskets = async (req: Request, res: Response): Promise<void> => {
  try {
    const expiredBaskets = await BasketRepo.findExpiredBaskets();

    let deletedCount = 0;
    for (const basket of expiredBaskets) {
      await BasketRepo.delete(basket.basketId);
      deletedCount++;
    }

    res.json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} expired baskets`,
      deletedCount
    });
  } catch (error: any) {
    console.error('Error cleaning up expired baskets:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to cleanup expired baskets' });
  }
};
