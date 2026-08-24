/**
 * Subscription Controller
 * Handles subscription plans and customer subscription management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageAdminSubscriptionsUseCase } from '../../../modules/subscription/application/useCases/ManageAdminSubscriptions';
import { adminRespond } from '../../respond';

const manageSubscriptionsUseCase = new ManageAdminSubscriptionsUseCase();

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
      result.setDate(result.getDate() + count * 7);
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

export const listSubscriptionPlans = async (req: TypedRequest, res: Response): Promise<void> => {
  const productId = req.query.productId as string;
  const activeOnly = req.query.activeOnly !== 'false';
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // For now, get all plans (would need to filter by product in a real implementation)
  const plans = await manageSubscriptionsUseCase.getSubscriptionPlans(productId || 'any', activeOnly);

  adminRespond(req, res, 'programs/subscription/plans/index', {
    pageName: 'Subscription Plans',
    plans,
    filters: { productId, activeOnly },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

export const createSubscriptionPlanForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const productId = req.query.productId as string;

  adminRespond(req, res, 'programs/subscription/plans/create', {
    pageName: 'Create Subscription Plan',
    productId,
  });
  
};

export const createSubscriptionPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
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
      isPopular,
    } = body;

    const plan = await manageSubscriptionsUseCase.saveSubscriptionPlan({
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
      isPopular: isPopular === 'true',
    });

    res.redirect(`/hub/subscription/plans/${plan.subscriptionPlanId}?success=Subscription plan created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'programs/subscription/plans/create', {
      pageName: 'Create Subscription Plan',
      error: (error as Error).message || 'Failed to create subscription plan',
      formData: req.body as RequestBody,
    });
  }
};

export const viewSubscriptionPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  const plan = await manageSubscriptionsUseCase.getSubscriptionPlan(planId);

  if (!plan) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Subscription plan not found',
    });
    return;
  }

  adminRespond(req, res, 'programs/subscription/plans/view', {
    pageName: `Plan: ${plan.name}`,
    plan,

    success: req.query.success || null,
  });
  
};

export const editSubscriptionPlanForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  const plan = await manageSubscriptionsUseCase.getSubscriptionPlan(planId);

  if (!plan) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Subscription plan not found',
    });
    return;
  }

  adminRespond(req, res, 'programs/subscription/plans/edit', {
    pageName: `Edit: ${plan.name}`,
    plan,
  });
  
};

export const updateSubscriptionPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
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
    isActive,
  } = body;

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
  if (freeShippingThreshold !== undefined)
    updates.freeShippingThreshold = freeShippingThreshold ? parseFloat(freeShippingThreshold) : undefined;
  if (includesFreeShipping !== undefined) updates.includesFreeShipping = includesFreeShipping === 'true';
  if (includedProducts !== undefined) updates.includedProducts = includedProducts ? JSON.parse(includedProducts) : undefined;
  if (features !== undefined) updates.features = features ? JSON.parse(features) : undefined;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder ? parseInt(sortOrder) : 0;
  if (isPopular !== undefined) updates.isPopular = isPopular === 'true';
  if (isActive !== undefined) updates.isActive = isActive !== 'false';

  const _plan = await manageSubscriptionsUseCase.saveSubscriptionPlan({
    subscriptionPlanId: planId,
    ...updates,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  res.redirect(`/hub/subscription/plans/${planId}?success=Subscription plan updated successfully`);
  
};

export const deleteSubscriptionPlan = async (req: TypedRequest, res: Response): Promise<void> => {
  const { planId } = req.params;

  await manageSubscriptionsUseCase.deleteSubscriptionPlan(planId);

  res.json({ success: true, message: 'Subscription plan deleted successfully' });
  
};

// ============================================================================
// Customer Subscriptions Management
// ============================================================================

export const listCustomerSubscriptions = async (req: TypedRequest, res: Response): Promise<void> => {
  const customerId = req.query.customerId as string;
  const status = req.query.status as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await manageSubscriptionsUseCase.getCustomerSubscriptions(
    {
      customerId,
      status: status as 'pending' | 'trialing' | 'active' | 'paused' | 'past_due' | 'cancelled' | 'expired' | undefined,
    },
    { limit, offset },
  );

  adminRespond(req, res, 'programs/subscription/subscriptions/index', {
    pageName: 'Customer Subscriptions',
    subscriptions: result.data,
    total: result.total,
    filters: { customerId, status },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

export const viewCustomerSubscription = async (req: TypedRequest, res: Response): Promise<void> => {
  const { subscriptionId } = req.params;

  // Get subscription details (would need to implement in repo)
  const subscription = { subscriptionId }; // Placeholder

  // Get orders for this subscription
  const orders = await manageSubscriptionsUseCase.getSubscriptionOrders(subscriptionId);

  adminRespond(req, res, 'programs/subscription/subscriptions/view', {
    pageName: `Subscription: ${subscriptionId}`,
    subscription,
    orders,

    success: req.query.success || null,
  });
  
};

export const updateSubscriptionStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as RequestBody;
  const { status } = body;

  await manageSubscriptionsUseCase.updateSubscriptionStatus(subscriptionId, status);

  res.json({ success: true, message: `Subscription status updated to ${status}` });
  
};

export const cancelCustomerSubscription = async (req: TypedRequest, res: Response): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as RequestBody;
  const { reason, cancelAtPeriodEnd } = body;

  await manageSubscriptionsUseCase.cancelSubscription(subscriptionId, reason, 'admin', cancelAtPeriodEnd === 'true');

  res.json({ success: true, message: 'Subscription cancelled successfully' });
  
};

// ============================================================================
// Billing Management
// ============================================================================

export const subscriptionBilling = async (req: TypedRequest, res: Response): Promise<void> => {
  // Get subscriptions due for billing (next billing date <= today + 1 day)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const subscriptionsDue = await manageSubscriptionsUseCase.getSubscriptionsDueBilling(tomorrow);
  const pendingOrders = await manageSubscriptionsUseCase.getSubscriptionOrdersPending();
  const failedPayments = await manageSubscriptionsUseCase.getFailedSubscriptionPayments();

  adminRespond(req, res, 'programs/subscription/billing/index', {
    pageName: 'Subscription Billing',
    subscriptionsDue,
    pendingOrders,
    failedPayments,
    stats: {
      dueToday: subscriptionsDue.length,
      pendingOrders: pendingOrders.length,
      failedPayments: failedPayments.length,
    },
  });
  
};

export const processSubscriptionBilling = async (req: TypedRequest, res: Response): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as RequestBody;
  const { processPayment, _billingCycle } = body;

  const subscription = await manageSubscriptionsUseCase.getCustomerSubscription(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Create billing order for this cycle
  const now = new Date();
  const billingCycleNumber = subscription.billingCycleCount + 1;

  // Calculate period dates
  const periodStart = subscription.currentPeriodEnd || now;
  const periodEnd = calculateNextBillingDate(periodStart, subscription.billingInterval, subscription.billingIntervalCount);

  const order = await manageSubscriptionsUseCase.createSubscriptionOrder({
    customerSubscriptionId: subscriptionId,
    billingCycleNumber,
    periodStart,
    periodEnd,
    subtotal: subscription.unitPrice * subscription.quantity,
    discountAmount: subscription.discountAmount,
    taxAmount: 0, // Would calculate based on tax rules
    shippingAmount: 0, // Would calculate based on shipping rules
  });

  if (processPayment === 'true') {
    // Simulate payment processing

    // In a real implementation, this would integrate with payment gateway
    await manageSubscriptionsUseCase.updateSubscriptionOrderStatus(order.subscriptionOrderId, 'paid');

    // Advance billing cycle
    await manageSubscriptionsUseCase.advanceBillingCycle(subscriptionId);

    // Update subscription lifetime value
    // This would be calculated from all paid orders
  }

  res.json({
    success: true,
    message: `Billing processed for subscription ${subscriptionId}`,
    orderId: order.subscriptionOrderId,
  });
  
};

export const manageFailedPayments = async (req: TypedRequest, res: Response): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as RequestBody;
  const { action, retryDate } = body;

  if (action === 'retry') {
    // Create dunning attempt
    const subscription = await manageSubscriptionsUseCase.getCustomerSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await manageSubscriptionsUseCase.createDunningAttempt({
      customerSubscriptionId: subscriptionId,
      attemptNumber: subscription.failedPaymentCount + 1,
      amount: subscription.totalPrice,
      currency: subscription.currency,
      scheduledAt: retryDate ? new Date(retryDate) : new Date(),
    });

    res.json({ success: true, message: 'Payment retry scheduled' });
  } else if (action === 'cancel') {
    await manageSubscriptionsUseCase.cancelSubscription(subscriptionId, 'Payment failed - subscription cancelled');
    res.json({ success: true, message: 'Subscription cancelled due to failed payment' });
  } else if (action === 'pause') {
    await manageSubscriptionsUseCase.pauseSubscription(subscriptionId, undefined, 'Payment failed - subscription paused');
    res.json({ success: true, message: 'Subscription paused due to failed payment' });
  } else {
    throw new Error('Invalid action');
  }
  
};
