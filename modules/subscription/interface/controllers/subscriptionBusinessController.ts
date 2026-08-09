/**
 * Subscription Business Controller
 * Handles admin/merchant subscription operations
 */

import { logger } from '../../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as subscriptionRepo from '../../infrastructure/repositories/subscriptionRepo';

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

// ============================================================================
// Subscription Products
// ============================================================================

export const getSubscriptionProducts: AsyncHandler = async (req, res, _next) => {
  try {
    const { activeOnly } = req.query;
    const products = await subscriptionRepo.getSubscriptionProducts(activeOnly !== 'false');
    res.json({ success: true, data: products });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  try {
    const product = await subscriptionRepo.getSubscriptionProduct(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Subscription product not found' });
      return;
    }

    const plans = await subscriptionRepo.getSubscriptionPlans(req.params.id);
    res.json({ success: true, data: { ...product, plans } });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<subscriptionRepo.SubscriptionProduct> & { productId: string };
    const product = await subscriptionRepo.saveSubscriptionProduct(body);
    res.status(201).json({ success: true, data: product });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<subscriptionRepo.SubscriptionProduct>;
    const product = await subscriptionRepo.saveSubscriptionProduct({
      subscriptionProductId: req.params.id,
      ...body,
    } as Partial<subscriptionRepo.SubscriptionProduct> & { productId: string });
    res.json({ success: true, data: product });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  try {
    await subscriptionRepo.deleteSubscriptionProduct(req.params.id);
    res.json({ success: true, message: 'Subscription product deactivated' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Subscription Plans
// ============================================================================

export const getSubscriptionPlans: AsyncHandler = async (req, res, _next) => {
  try {
    const { activeOnly } = req.query;
    const plans = await subscriptionRepo.getSubscriptionPlans(req.params.productId, activeOnly !== 'false');
    res.json({ success: true, data: plans });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  try {
    const plan = await subscriptionRepo.getSubscriptionPlan(req.params.planId);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Subscription plan not found' });
      return;
    }
    res.json({ success: true, data: plan });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<subscriptionRepo.SubscriptionPlan> & { name: string; price: number };
    const plan = await subscriptionRepo.saveSubscriptionPlan({
      subscriptionProductId: req.params.productId,
      ...body,
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<subscriptionRepo.SubscriptionPlan> & { name: string; price: number };
    const plan = await subscriptionRepo.saveSubscriptionPlan({
      subscriptionPlanId: req.params.planId,
      subscriptionProductId: req.params.productId,
      ...body,
    });
    res.json({ success: true, data: plan });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  try {
    await subscriptionRepo.deleteSubscriptionPlan(req.params.planId);
    res.json({ success: true, message: 'Subscription plan deactivated' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Customer Subscriptions (Admin View)
// ============================================================================

export const getCustomerSubscriptions: AsyncHandler = async (req, res, _next) => {
  try {
    const { customerId, status, limit, offset } = req.query;
    const result = await subscriptionRepo.getCustomerSubscriptions(
      { customerId: customerId as string, status: status as subscriptionRepo.SubscriptionStatus | undefined },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getCustomerSubscription: AsyncHandler = async (req, res, _next) => {
  try {
    const subscription = await subscriptionRepo.getCustomerSubscription(req.params.id);
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    const orders = await subscriptionRepo.getSubscriptionOrders(req.params.id);
    const dunningAttempts = await subscriptionRepo.getDunningAttempts(req.params.id);

    res.json({ success: true, data: { ...subscription, orders, dunningAttempts } });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const cancelSubscriptionAdmin: AsyncHandler = async (req, res, _next) => {
  try {
    const { reason, cancelAtPeriodEnd } = req.body as { reason?: string; cancelAtPeriodEnd?: boolean };
    const adminId = req.user?.userId || req.user?.merchantId;

    await subscriptionRepo.cancelSubscription(req.params.id, reason, `admin:${adminId}`, cancelAtPeriodEnd !== false);

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const pauseSubscriptionAdmin: AsyncHandler = async (req, res, _next) => {
  try {
    const { resumeAt, reason } = req.body as { resumeAt?: string; reason?: string };
    const adminId = req.user?.userId || req.user?.merchantId;

    const pause = await subscriptionRepo.pauseSubscription(
      req.params.id,
      resumeAt ? new Date(resumeAt) : undefined,
      reason,
      `admin:${adminId}`,
    );

    res.json({ success: true, data: pause });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const resumeSubscriptionAdmin: AsyncHandler = async (req, res, _next) => {
  try {
    const adminId = req.user?.userId || req.user?.merchantId;
    await subscriptionRepo.resumeSubscription(req.params.id, `admin:${adminId}`);
    res.json({ success: true, message: 'Subscription resumed' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateSubscriptionStatus: AsyncHandler = async (req, res, _next) => {
  try {
    const { status } = req.body as { status: subscriptionRepo.SubscriptionStatus };
    await subscriptionRepo.updateSubscriptionStatus(req.params.id, status);
    res.json({ success: true, message: 'Subscription status updated' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Subscription Orders (Admin View)
// ============================================================================

export const getSubscriptionOrders: AsyncHandler = async (req, res, _next) => {
  try {
    const orders = await subscriptionRepo.getSubscriptionOrders(req.params.subscriptionId);
    res.json({ success: true, data: orders });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const retrySubscriptionOrder: AsyncHandler = async (req, res, _next) => {
  try {
    // Mark order for retry
    await subscriptionRepo.updateSubscriptionOrderStatus(req.params.orderId, 'pending');
    res.json({ success: true, message: 'Order marked for retry' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const skipSubscriptionOrder: AsyncHandler = async (req, res, _next) => {
  try {
    await subscriptionRepo.updateSubscriptionOrderStatus(req.params.orderId, 'skipped');
    res.json({ success: true, message: 'Order skipped' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Dunning Management
// ============================================================================

export const getDunningAttempts: AsyncHandler = async (req, res, _next) => {
  try {
    const attempts = await subscriptionRepo.getDunningAttempts(req.params.subscriptionId);
    res.json({ success: true, data: attempts });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getPendingDunning: AsyncHandler = async (req, res, _next) => {
  try {
    const attempts = await subscriptionRepo.getPendingDunningAttempts(new Date());
    res.json({ success: true, data: attempts });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Billing Operations
// ============================================================================

export const getSubscriptionsDueBilling: AsyncHandler = async (req, res, _next) => {
  try {
    const { beforeDate } = req.query;
    const date = beforeDate ? new Date(beforeDate as string) : new Date();
    const subscriptions = await subscriptionRepo.getSubscriptionsDueBilling(date);
    res.json({ success: true, data: subscriptions });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const processBillingCycle: AsyncHandler = async (req, res, _next) => {
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
      taxAmount: subscription.taxAmount,
    });

    // Advance billing cycle
    await subscriptionRepo.advanceBillingCycle(subscription.customerSubscriptionId);

    res.json({ success: true, data: order });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
