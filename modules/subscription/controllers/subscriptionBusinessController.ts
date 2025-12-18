/**
 * Subscription Business Controller
 * Handles admin/merchant subscription operations
 */

import { Request, Response, NextFunction } from 'express';
import * as subscriptionRepo from '../repos/subscriptionRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Subscription Products
// ============================================================================

export const getSubscriptionProducts: AsyncHandler = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const products = await subscriptionRepo.getSubscriptionProducts(activeOnly !== 'false');
    res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Get subscription products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscriptionProduct: AsyncHandler = async (req, res, next) => {
  try {
    const product = await subscriptionRepo.getSubscriptionProduct(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Subscription product not found' });
      return;
    }
    
    const plans = await subscriptionRepo.getSubscriptionPlans(req.params.id);
    res.json({ success: true, data: { ...product, plans } });
  } catch (error: any) {
    console.error('Get subscription product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubscriptionProduct: AsyncHandler = async (req, res, next) => {
  try {
    const product = await subscriptionRepo.saveSubscriptionProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    console.error('Create subscription product error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubscriptionProduct: AsyncHandler = async (req, res, next) => {
  try {
    const product = await subscriptionRepo.saveSubscriptionProduct({
      subscriptionProductId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: product });
  } catch (error: any) {
    console.error('Update subscription product error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSubscriptionProduct: AsyncHandler = async (req, res, next) => {
  try {
    await subscriptionRepo.deleteSubscriptionProduct(req.params.id);
    res.json({ success: true, message: 'Subscription product deactivated' });
  } catch (error: any) {
    console.error('Delete subscription product error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Subscription Plans
// ============================================================================

export const getSubscriptionPlans: AsyncHandler = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const plans = await subscriptionRepo.getSubscriptionPlans(
      req.params.productId,
      activeOnly !== 'false'
    );
    res.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscriptionPlan: AsyncHandler = async (req, res, next) => {
  try {
    const plan = await subscriptionRepo.getSubscriptionPlan(req.params.planId);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Subscription plan not found' });
      return;
    }
    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Get subscription plan error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubscriptionPlan: AsyncHandler = async (req, res, next) => {
  try {
    const plan = await subscriptionRepo.saveSubscriptionPlan({
      subscriptionProductId: req.params.productId,
      ...req.body
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Create subscription plan error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubscriptionPlan: AsyncHandler = async (req, res, next) => {
  try {
    const plan = await subscriptionRepo.saveSubscriptionPlan({
      subscriptionPlanId: req.params.planId,
      subscriptionProductId: req.params.productId,
      ...req.body
    });
    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Update subscription plan error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSubscriptionPlan: AsyncHandler = async (req, res, next) => {
  try {
    await subscriptionRepo.deleteSubscriptionPlan(req.params.planId);
    res.json({ success: true, message: 'Subscription plan deactivated' });
  } catch (error: any) {
    console.error('Delete subscription plan error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Customer Subscriptions (Admin View)
// ============================================================================

export const getCustomerSubscriptions: AsyncHandler = async (req, res, next) => {
  try {
    const { customerId, status, limit, offset } = req.query;
    const result = await subscriptionRepo.getCustomerSubscriptions(
      { customerId: customerId as string, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get customer subscriptions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerSubscription: AsyncHandler = async (req, res, next) => {
  try {
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    
    const orders = await subscriptionRepo.getSubscriptionOrders(req.params.id);
    const dunningAttempts = await subscriptionRepo.getDunningAttempts(req.params.id);
    
    res.json({ success: true, data: { ...subscription, orders, dunningAttempts } });
  } catch (error: any) {
    console.error('Get customer subscription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelSubscriptionAdmin: AsyncHandler = async (req, res, next) => {
  try {
    const { reason, cancelAtPeriodEnd } = req.body;
    const adminId = (req as any).userId || (req as any).merchantId;
    
    await subscriptionRepo.cancelSubscription(
      req.params.id,
      reason,
      `admin:${adminId}`,
      cancelAtPeriodEnd !== false
    );
    
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const pauseSubscriptionAdmin: AsyncHandler = async (req, res, next) => {
  try {
    const { resumeAt, reason } = req.body;
    const adminId = (req as any).userId || (req as any).merchantId;
    
    const pause = await subscriptionRepo.pauseSubscription(
      req.params.id,
      resumeAt ? new Date(resumeAt) : undefined,
      reason,
      `admin:${adminId}`
    );
    
    res.json({ success: true, data: pause });
  } catch (error: any) {
    console.error('Pause subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resumeSubscriptionAdmin: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).userId || (req as any).merchantId;
    await subscriptionRepo.resumeSubscription(req.params.id, `admin:${adminId}`);
    res.json({ success: true, message: 'Subscription resumed' });
  } catch (error: any) {
    console.error('Resume subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubscriptionStatus: AsyncHandler = async (req, res, next) => {
  try {
    const { status } = req.body;
    await subscriptionRepo.updateSubscriptionStatus(req.params.id, status);
    res.json({ success: true, message: 'Subscription status updated' });
  } catch (error: any) {
    console.error('Update subscription status error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Subscription Orders (Admin View)
// ============================================================================

export const getSubscriptionOrders: AsyncHandler = async (req, res, next) => {
  try {
    const orders = await subscriptionRepo.getSubscriptionOrders(req.params.subscriptionId);
    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Get subscription orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const retrySubscriptionOrder: AsyncHandler = async (req, res, next) => {
  try {
    // Mark order for retry
    await subscriptionRepo.updateSubscriptionOrderStatus(req.params.orderId, 'pending');
    res.json({ success: true, message: 'Order marked for retry' });
  } catch (error: any) {
    console.error('Retry subscription order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const skipSubscriptionOrder: AsyncHandler = async (req, res, next) => {
  try {
    await subscriptionRepo.updateSubscriptionOrderStatus(req.params.orderId, 'skipped');
    res.json({ success: true, message: 'Order skipped' });
  } catch (error: any) {
    console.error('Skip subscription order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Dunning Management
// ============================================================================

export const getDunningAttempts: AsyncHandler = async (req, res, next) => {
  try {
    const attempts = await subscriptionRepo.getDunningAttempts(req.params.subscriptionId);
    res.json({ success: true, data: attempts });
  } catch (error: any) {
    console.error('Get dunning attempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingDunning: AsyncHandler = async (req, res, next) => {
  try {
    const attempts = await subscriptionRepo.getPendingDunningAttempts(new Date());
    res.json({ success: true, data: attempts });
  } catch (error: any) {
    console.error('Get pending dunning error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Billing Operations
// ============================================================================

export const getSubscriptionsDueBilling: AsyncHandler = async (req, res, next) => {
  try {
    const { beforeDate } = req.query;
    const date = beforeDate ? new Date(beforeDate as string) : new Date();
    const subscriptions = await subscriptionRepo.getSubscriptionsDueBilling(date);
    res.json({ success: true, data: subscriptions });
  } catch (error: any) {
    console.error('Get subscriptions due billing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processBillingCycle: AsyncHandler = async (req, res, next) => {
  try {
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Create subscription order
    const order = await subscriptionRepo.createSubscriptionOrder({
      customerSubscriptionId: subscription.customerSubscriptionId,
      billingCycleNumber: subscription.billingCycleCount + 1,
      periodStart: subscription.currentPeriodEnd || new Date(),
      periodEnd: new Date(), // Will be calculated properly
      subtotal: subscription.totalPrice,
      discountAmount: subscription.discountAmount,
      taxAmount: subscription.taxAmount
    });

    // Advance billing cycle
    await subscriptionRepo.advanceBillingCycle(subscription.customerSubscriptionId);

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Process billing cycle error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
