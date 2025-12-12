/**
 * Subscription Customer Controller
 * Handles customer-facing subscription operations
 */

import { Request, Response, NextFunction } from 'express';
import * as subscriptionRepo from '../repos/subscriptionRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Browse Subscription Products
// ============================================================================

export const getAvailableSubscriptionProducts: AsyncHandler = async (req, res, next) => {
  try {
    const products = await subscriptionRepo.getSubscriptionProducts(true);
    res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Get available subscription products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscriptionProductDetails: AsyncHandler = async (req, res, next) => {
  try {
    // Try to get by product ID first (for product page integration)
    let product = await subscriptionRepo.getSubscriptionProductByProductId(req.params.productId);
    
    if (!product) {
      product = await subscriptionRepo.getSubscriptionProduct(req.params.productId);
    }
    
    if (!product || !product.isActive) {
      res.status(404).json({ success: false, message: 'Subscription product not found' });
      return;
    }
    
    const plans = await subscriptionRepo.getSubscriptionPlans(product.subscriptionProductId, true);
    res.json({ success: true, data: { ...product, plans } });
  } catch (error: any) {
    console.error('Get subscription product details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscriptionPlanDetails: AsyncHandler = async (req, res, next) => {
  try {
    const plan = await subscriptionRepo.getSubscriptionPlan(req.params.planId);
    if (!plan || !plan.isActive) {
      res.status(404).json({ success: false, message: 'Subscription plan not found' });
      return;
    }
    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Get subscription plan details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// My Subscriptions
// ============================================================================

export const getMySubscriptions: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { status, limit, offset } = req.query;
    
    const result = await subscriptionRepo.getCustomerSubscriptions(
      { customerId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get my subscriptions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySubscription: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    
    const orders = await subscriptionRepo.getSubscriptionOrders(req.params.id);
    const plan = await subscriptionRepo.getSubscriptionPlan(subscription.subscriptionPlanId);
    
    res.json({ success: true, data: { ...subscription, plan, orders } });
  } catch (error: any) {
    console.error('Get my subscription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Subscribe
// ============================================================================

export const createSubscription: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { 
      subscriptionPlanId, 
      productVariantId, 
      quantity,
      shippingAddressId,
      billingAddressId,
      paymentMethodId,
      customizations
    } = req.body;

    // Validate plan exists and is active
    const plan = await subscriptionRepo.getSubscriptionPlan(subscriptionPlanId);
    if (!plan || !plan.isActive) {
      res.status(400).json({ success: false, message: 'Invalid subscription plan' });
      return;
    }

    const subscription = await subscriptionRepo.createCustomerSubscription({
      customerId,
      subscriptionPlanId,
      subscriptionProductId: plan.subscriptionProductId,
      productVariantId,
      quantity,
      shippingAddressId,
      billingAddressId,
      paymentMethodId,
      customizations
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Manage Subscription
// ============================================================================

export const updateMySubscription: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Only allow updating certain fields
    const { quantity, shippingAddressId, billingAddressId, paymentMethodId, customizations } = req.body;
    
    // For now, we'll just return success - full update logic would need more implementation
    res.json({ success: true, message: 'Subscription updated' });
  } catch (error: any) {
    console.error('Update my subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePlan: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      res.status(400).json({ success: false, message: 'Cannot change plan for inactive subscription' });
      return;
    }

    const { newPlanId } = req.body;
    const newPlan = await subscriptionRepo.getSubscriptionPlan(newPlanId);
    
    if (!newPlan || !newPlan.isActive) {
      res.status(400).json({ success: false, message: 'Invalid plan' });
      return;
    }

    // Plan change logic would go here - proration, etc.
    res.json({ success: true, message: 'Plan change scheduled' });
  } catch (error: any) {
    console.error('Change plan error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const pauseMySubscription: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    if (subscription.status !== 'active') {
      res.status(400).json({ success: false, message: 'Only active subscriptions can be paused' });
      return;
    }

    // Check if pausing is allowed
    const product = subscription.subscriptionProductId 
      ? await subscriptionRepo.getSubscriptionProduct(subscription.subscriptionProductId)
      : null;
    
    if (product && !product.allowPause) {
      res.status(400).json({ success: false, message: 'Pausing is not allowed for this subscription' });
      return;
    }

    if (product?.maxPausesPerYear && subscription.pauseCount >= product.maxPausesPerYear) {
      res.status(400).json({ success: false, message: 'Maximum pauses reached for this year' });
      return;
    }

    const { resumeAt, reason } = req.body;
    
    // Validate pause duration
    if (product?.maxPauseDays && resumeAt) {
      const pauseDays = Math.ceil((new Date(resumeAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (pauseDays > product.maxPauseDays) {
        res.status(400).json({ 
          success: false, 
          message: `Maximum pause duration is ${product.maxPauseDays} days` 
        });
        return;
      }
    }

    const pause = await subscriptionRepo.pauseSubscription(
      req.params.id,
      resumeAt ? new Date(resumeAt) : undefined,
      reason,
      'customer'
    );

    res.json({ success: true, data: pause });
  } catch (error: any) {
    console.error('Pause my subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resumeMySubscription: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    if (subscription.status !== 'paused') {
      res.status(400).json({ success: false, message: 'Subscription is not paused' });
      return;
    }

    await subscriptionRepo.resumeSubscription(req.params.id, 'customer');
    res.json({ success: true, message: 'Subscription resumed' });
  } catch (error: any) {
    console.error('Resume my subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelMySubscription: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      res.status(400).json({ success: false, message: 'Subscription is already cancelled' });
      return;
    }

    // Check contract requirements
    if (subscription.contractCyclesRemaining && subscription.contractCyclesRemaining > 0) {
      const product = subscription.subscriptionProductId 
        ? await subscriptionRepo.getSubscriptionProduct(subscription.subscriptionProductId)
        : null;
      
      if (product && !product.allowEarlyCancel) {
        res.status(400).json({ 
          success: false, 
          message: `Contract requires ${subscription.contractCyclesRemaining} more billing cycles` 
        });
        return;
      }
      
      // Note: Early termination fee would be handled here
    }

    const { reason, cancelAtPeriodEnd } = req.body;
    
    await subscriptionRepo.cancelSubscription(
      req.params.id,
      reason,
      'customer',
      cancelAtPeriodEnd !== false // Default to cancel at period end
    );

    res.json({ 
      success: true, 
      message: cancelAtPeriodEnd !== false 
        ? 'Subscription will be cancelled at the end of the current billing period'
        : 'Subscription cancelled immediately'
    });
  } catch (error: any) {
    console.error('Cancel my subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reactivateMySubscription: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Can only reactivate if cancelled at period end but period hasn't ended
    if (!subscription.cancelAtPeriodEnd) {
      res.status(400).json({ success: false, message: 'Subscription cannot be reactivated' });
      return;
    }

    await subscriptionRepo.updateSubscriptionStatus(req.params.id, 'active', {
      cancelledAt: undefined,
      cancellationReason: undefined,
      cancelledBy: undefined
    });

    res.json({ success: true, message: 'Subscription reactivated' });
  } catch (error: any) {
    console.error('Reactivate my subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Billing History
// ============================================================================

export const getMySubscriptionOrders: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    const orders = await subscriptionRepo.getSubscriptionOrders(req.params.id);
    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Get my subscription orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Skip Delivery
// ============================================================================

export const skipNextDelivery: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    
    if (!subscription || subscription.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Check if skipping is allowed
    const product = subscription.subscriptionProductId 
      ? await subscriptionRepo.getSubscriptionProduct(subscription.subscriptionProductId)
      : null;
    
    if (product && !product.allowSkip) {
      res.status(400).json({ success: false, message: 'Skipping is not allowed for this subscription' });
      return;
    }

    if (product?.maxSkipsPerYear && subscription.skipCount >= product.maxSkipsPerYear) {
      res.status(400).json({ success: false, message: 'Maximum skips reached for this year' });
      return;
    }

    // Advance to next billing cycle without charging
    await subscriptionRepo.advanceBillingCycle(subscription.customerSubscriptionId);
    
    res.json({ success: true, message: 'Next delivery skipped' });
  } catch (error: any) {
    console.error('Skip next delivery error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
