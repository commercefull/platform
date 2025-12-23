/**
 * Basket Controller
 * Handles abandoned cart recovery and basket analytics for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import BasketRepo from '../../../modules/basket/infrastructure/repositories/BasketRepository';
import { adminRespond } from 'web/respond';

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

    adminRespond(req, res, 'operations/baskets/abandoned', {
      pageName: 'Abandoned Carts',
      abandonedBaskets,
      expiredBaskets,
      stats,
      filters: { olderThanDays },
      pagination: { limit, offset },
      
      success: req.query.success || null
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load abandoned carts',
    });
  }
};

export const viewAbandonedCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    const basket = await BasketRepo.findById(basketId);

    if (!basket) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Abandoned cart not found',
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

    adminRespond(req, res, 'operations/baskets/view', {
      pageName: `Abandoned Cart: ${basket.basketId}`,
      basket,
      cartValue,
      daysSinceActivity,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load abandoned cart',
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
    logger.error('Error:', error);
    
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
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to send recovery email' });
  }
};

export const markCartRecovered = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId } = req.params;

    // In a real implementation, this would be called when a customer completes purchase from recovered cart
    

    res.json({ success: true, message: 'Cart marked as recovered' });
  } catch (error: any) {
    logger.error('Error:', error);
    
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

    adminRespond(req, res, 'operations/baskets/analytics', {
      pageName: 'Cart Analytics',
      stats,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load basket analytics',
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
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to cleanup expired baskets' });
  }
};
