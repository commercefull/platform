/**
 * Subscription Controller
 * Handles subscription plans and customer subscription management for the Admin Hub
 */

import { Request, Response } from 'express';
import {
  getSubscriptionPlan,
  getSubscriptionPlans,
  saveSubscriptionPlan,
  deleteSubscriptionPlan as deleteSubscriptionPlanRepo,
  getCustomerSubscriptions,
  updateSubscriptionStatus as updateSubscriptionStatusRepo,
  cancelSubscription,
  getSubscriptionOrders,
  getCustomerSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionsDueBilling,
  getSubscriptionOrdersPending,
  getFailedSubscriptionPayments,
  advanceBillingCycle,
  createDunningAttempt,
  createSubscriptionOrder,
  updateSubscriptionOrderStatus
} from '../../../modules/subscription/repos/subscriptionRepo';

// ============================================================================
// Helper Functions
// ============================================================================

function calculateNextBillingDate(fromDate: Date, interval: string, count: number): Date {
  const result = new Date(fromDate);

  switch (interval) {
    case 'day':
      result.setDate(result.getDate() + count);
      break;
    case 'week':
      result.setDate(result.getDate() + (count * 7));
      break;
    case 'month':
      result.setMonth(result.getMonth() + count);
      break;
    case 'year':
      result.setFullYear(result.getFullYear() + count);
      break;
    default:
      result.setMonth(result.getMonth() + 1); // default to monthly
  }

  return result;
}

// ============================================================================
// Subscription Plans Management
// ============================================================================

export const listSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.query.productId as string;
    const activeOnly = req.query.activeOnly !== 'false';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // For now, get all plans (would need to filter by product in a real implementation)
    const plans = await getSubscriptionPlans(productId || 'any', activeOnly);

    res.render('admin/views/programs/subscription/plans/index', {
      pageName: 'Subscription Plans',
      plans,
      filters: { productId, activeOnly },
      pagination: { limit, offset },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing subscription plans:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load subscription plans',
      user: req.user
    });
  }
};

export const createSubscriptionPlanForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.query.productId as string;

    res.render('admin/views/programs/subscription/plans/create', {
      pageName: 'Create Subscription Plan',
      productId,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create subscription plan form:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subscriptionProductId,
      name,
      description,
      billingInterval,
      billingIntervalCount,
      price,
      compareAtPrice,
      currency,
      setupFee,
      trialDays,
      contractLength,
      isContractRequired,
      discountPercent,
      discountAmount,
      freeShippingThreshold,
      includesFreeShipping,
      includedProducts,
      features,
      sortOrder,
      isPopular
    } = req.body;

    const plan = await saveSubscriptionPlan({
      subscriptionProductId,
      name,
      description: description || undefined,
      billingInterval: billingInterval || 'month',
      billingIntervalCount: billingIntervalCount ? parseInt(billingIntervalCount) : 1,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      currency: currency || 'USD',
      setupFee: setupFee ? parseFloat(setupFee) : 0,
      trialDays: trialDays ? parseInt(trialDays) : undefined,
      contractLength: contractLength ? parseInt(contractLength) : undefined,
      isContractRequired: isContractRequired === 'true',
      discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
      discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
      freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : undefined,
      includesFreeShipping: includesFreeShipping === 'true',
      includedProducts: includedProducts ? JSON.parse(includedProducts) : undefined,
      features: features ? JSON.parse(features) : undefined,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      isPopular: isPopular === 'true'
    });

    res.redirect(`/hub/subscription/plans/${plan.subscriptionPlanId}?success=Subscription plan created successfully`);
  } catch (error: any) {
    console.error('Error creating subscription plan:', error);

    res.render('admin/views/programs/subscription/plans/create', {
      pageName: 'Create Subscription Plan',
      error: error.message || 'Failed to create subscription plan',
      formData: req.body,
      user: req.user
    });
  }
};

export const viewSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await getSubscriptionPlan(planId);

    if (!plan) {
      res.status(404).render('admin/views/error', {
        pageName: 'Not Found',
        error: 'Subscription plan not found',
        user: req.user
      });
      return;
    }

    res.render('admin/views/programs/subscription/plans/view', {
      pageName: `Plan: ${plan.name}`,
      plan,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing subscription plan:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load subscription plan',
      user: req.user
    });
  }
};

export const editSubscriptionPlanForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await getSubscriptionPlan(planId);

    if (!plan) {
      res.status(404).render('admin/views/error', {
        pageName: 'Not Found',
        error: 'Subscription plan not found',
        user: req.user
      });
      return;
    }

    res.render('admin/views/programs/subscription/plans/edit', {
      pageName: `Edit: ${plan.name}`,
      plan,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading edit subscription plan form:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const updateSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const updates: any = {};

    const {
      name,
      description,
      billingInterval,
      billingIntervalCount,
      price,
      compareAtPrice,
      currency,
      setupFee,
      trialDays,
      contractLength,
      isContractRequired,
      discountPercent,
      discountAmount,
      freeShippingThreshold,
      includesFreeShipping,
      includedProducts,
      features,
      sortOrder,
      isPopular,
      isActive
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description || undefined;
    if (billingInterval !== undefined) updates.billingInterval = billingInterval;
    if (billingIntervalCount !== undefined) updates.billingIntervalCount = billingIntervalCount ? parseInt(billingIntervalCount) : 1;
    if (price !== undefined) updates.price = parseFloat(price);
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : undefined;
    if (currency !== undefined) updates.currency = currency;
    if (setupFee !== undefined) updates.setupFee = setupFee ? parseFloat(setupFee) : 0;
    if (trialDays !== undefined) updates.trialDays = trialDays ? parseInt(trialDays) : undefined;
    if (contractLength !== undefined) updates.contractLength = contractLength ? parseInt(contractLength) : undefined;
    if (isContractRequired !== undefined) updates.isContractRequired = isContractRequired === 'true';
    if (discountPercent !== undefined) updates.discountPercent = discountPercent ? parseFloat(discountPercent) : 0;
    if (discountAmount !== undefined) updates.discountAmount = discountAmount ? parseFloat(discountAmount) : 0;
    if (freeShippingThreshold !== undefined) updates.freeShippingThreshold = freeShippingThreshold ? parseFloat(freeShippingThreshold) : undefined;
    if (includesFreeShipping !== undefined) updates.includesFreeShipping = includesFreeShipping === 'true';
    if (includedProducts !== undefined) updates.includedProducts = includedProducts ? JSON.parse(includedProducts) : undefined;
    if (features !== undefined) updates.features = features ? JSON.parse(features) : undefined;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder ? parseInt(sortOrder) : 0;
    if (isPopular !== undefined) updates.isPopular = isPopular === 'true';
    if (isActive !== undefined) updates.isActive = isActive !== 'false';

    const plan = await saveSubscriptionPlan({
      subscriptionPlanId: planId,
      ...updates
    });

    res.redirect(`/hub/subscription/plans/${planId}?success=Subscription plan updated successfully`);
  } catch (error: any) {
    console.error('Error updating subscription plan:', error);

    try {
      const plan = await getSubscriptionPlan(req.params.planId);

      res.render('admin/views/programs/subscription/plans/edit', {
        pageName: `Edit: ${plan?.name || 'Plan'}`,
        plan,
        error: error.message || 'Failed to update subscription plan',
        formData: req.body,
        user: req.user
      });
    } catch {
      res.status(500).render('admin/views/error', {
        pageName: 'Error',
        error: error.message || 'Failed to update subscription plan',
        user: req.user
      });
    }
  }
};

export const deleteSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    await deleteSubscriptionPlanRepo(planId);

    res.json({ success: true, message: 'Subscription plan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete subscription plan' });
  }
};

// ============================================================================
// Customer Subscriptions Management
// ============================================================================

export const listCustomerSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.query.customerId as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getCustomerSubscriptions({
      customerId,
      status: status as any
    }, { limit, offset });

    res.render('admin/views/programs/subscription/subscriptions/index', {
      pageName: 'Customer Subscriptions',
      subscriptions: result.data,
      total: result.total,
      filters: { customerId, status },
      pagination: { limit, offset },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing customer subscriptions:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load customer subscriptions',
      user: req.user
    });
  }
};

export const viewCustomerSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;

    // Get subscription details (would need to implement in repo)
    const subscription = { subscriptionId }; // Placeholder

    // Get orders for this subscription
    const orders = await getSubscriptionOrders(subscriptionId);

    res.render('admin/views/programs/subscription/subscriptions/view', {
      pageName: `Subscription: ${subscriptionId}`,
      subscription,
      orders,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing customer subscription:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load customer subscription',
      user: req.user
    });
  }
};

export const updateSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const { status } = req.body;

    await updateSubscriptionStatusRepo(subscriptionId, status);

    res.json({ success: true, message: `Subscription status updated to ${status}` });
  } catch (error: any) {
    console.error('Error updating subscription status:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update subscription status' });
  }
};

export const cancelCustomerSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const { reason, cancelAtPeriodEnd } = req.body;

    await cancelSubscription(subscriptionId, reason, 'admin', cancelAtPeriodEnd === 'true');

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to cancel subscription' });
  }
};

// ============================================================================
// Billing Management
// ============================================================================

export const subscriptionBilling = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get subscriptions due for billing (next billing date <= today + 1 day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const subscriptionsDue = await getSubscriptionsDueBilling(tomorrow);
    const pendingOrders = await getSubscriptionOrdersPending();
    const failedPayments = await getFailedSubscriptionPayments();

    res.render('admin/views/programs/subscription/billing/index', {
      pageName: 'Subscription Billing',
      subscriptionsDue,
      pendingOrders,
      failedPayments,
      stats: {
        dueToday: subscriptionsDue.length,
        pendingOrders: pendingOrders.length,
        failedPayments: failedPayments.length
      },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading subscription billing:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load subscription billing',
      user: req.user
    });
  }
};

export const processSubscriptionBilling = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const { processPayment, billingCycle } = req.body;

    const subscription = await getCustomerSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Create billing order for this cycle
    const now = new Date();
    const billingCycleNumber = subscription.billingCycleCount + 1;

    // Calculate period dates
    const periodStart = subscription.currentPeriodEnd || now;
    const periodEnd = calculateNextBillingDate(periodStart, subscription.billingInterval, subscription.billingIntervalCount);

    const order = await createSubscriptionOrder({
      customerSubscriptionId: subscriptionId,
      billingCycleNumber,
      periodStart,
      periodEnd,
      subtotal: subscription.unitPrice * subscription.quantity,
      discountAmount: subscription.discountAmount,
      taxAmount: 0, // Would calculate based on tax rules
      shippingAmount: 0 // Would calculate based on shipping rules
    });

    if (processPayment === 'true') {
      // Simulate payment processing
      console.log(`Processing payment for subscription ${subscriptionId}, order ${order.subscriptionOrderId}`);

      // In a real implementation, this would integrate with payment gateway
      await updateSubscriptionOrderStatus(order.subscriptionOrderId, 'paid');

      // Advance billing cycle
      await advanceBillingCycle(subscriptionId);

      // Update subscription lifetime value
      // This would be calculated from all paid orders
    }

    res.json({
      success: true,
      message: `Billing processed for subscription ${subscriptionId}`,
      orderId: order.subscriptionOrderId
    });
  } catch (error: any) {
    console.error('Error processing subscription billing:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process billing' });
  }
};

export const manageFailedPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const { action, retryDate } = req.body;

    if (action === 'retry') {
      // Create dunning attempt
      const subscription = await getCustomerSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      await createDunningAttempt({
        customerSubscriptionId: subscriptionId,
        attemptNumber: subscription.failedPaymentCount + 1,
        amount: subscription.totalPrice,
        currency: subscription.currency,
        scheduledAt: retryDate ? new Date(retryDate) : new Date()
      });

      res.json({ success: true, message: 'Payment retry scheduled' });
    } else if (action === 'cancel') {
      await cancelSubscription(subscriptionId, 'Payment failed - subscription cancelled');
      res.json({ success: true, message: 'Subscription cancelled due to failed payment' });
    } else if (action === 'pause') {
      await pauseSubscription(subscriptionId, undefined, 'Payment failed - subscription paused');
      res.json({ success: true, message: 'Subscription paused due to failed payment' });
    } else {
      throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error managing failed payment:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to manage failed payment' });
  }
};
