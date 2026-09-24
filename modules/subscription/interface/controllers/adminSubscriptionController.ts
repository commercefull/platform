/**
 * Subscription Controller
 * Handles subscription plans and customer subscription management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import { buildFormObject, FieldConfig } from '../../../../libs/formParsing';
import { manageAdminSubscriptionsUseCase as manageSubscriptionsUseCase } from '../../application/wired';

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

export const listSubscriptionPlans = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const createSubscriptionPlanForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const productId = req.query.productId as string;

  adminRespond(req, res, 'programs/subscription/plans/create', {
    pageName: 'Create Subscription Plan',
    productId,
  });
};

const subPlanCreateFields: FieldConfig[] = [
  { name: 'subscriptionProductId' },
  { name: 'name' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'billingInterval', transform: 'stringOrUndefined', default: 'month' },
  { name: 'billingIntervalCount', transform: 'int', default: 1, falsyValue: 1 },
  { name: 'price', transform: 'cents', as: 'priceCents' },
  { name: 'compareAtPrice', transform: 'cents', as: 'compareAtPriceCents', falsyValue: undefined },
  { name: 'currency', transform: 'stringOrUndefined', default: 'USD' },
  { name: 'setupFee', transform: 'cents', as: 'setupFeeCents', default: 0, falsyValue: 0 },
  { name: 'trialDays', transform: 'int', falsyValue: undefined },
  { name: 'contractLength', transform: 'int', falsyValue: undefined },
  { name: 'isContractRequired', transform: 'boolTrue' },
  { name: 'discountPercent', transform: 'float', default: 0, falsyValue: 0 },
  { name: 'discountAmount', transform: 'cents', as: 'discountAmountCents', default: 0, falsyValue: 0 },
  { name: 'freeShippingThreshold', transform: 'cents', as: 'freeShippingThresholdCents', falsyValue: undefined },
  { name: 'includesFreeShipping', transform: 'boolTrue' },
  { name: 'includedProducts', transform: 'json', falsyValue: undefined },
  { name: 'features', transform: 'json', falsyValue: undefined },
  { name: 'sortOrder', transform: 'int', default: 0, falsyValue: 0 },
  { name: 'isPopular', transform: 'boolTrue' },
];

function parseSubscriptionPlanCreateInput(body: HttpRequestBody) {
  return buildFormObject(body as Record<string, unknown>, subPlanCreateFields);
}

export const createSubscriptionPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const plan = await manageSubscriptionsUseCase.saveSubscriptionPlan(
      parseSubscriptionPlanCreateInput(req.body as HttpRequestBody) as Parameters<
        typeof manageSubscriptionsUseCase.saveSubscriptionPlan
      >[0],
    );

    res.redirect(`/hub/subscription/plans/${plan.subscriptionPlanId}?success=Subscription plan created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'programs/subscription/plans/create', {
      pageName: 'Create Subscription Plan',
      error: (error as Error).message || 'Failed to create subscription plan',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewSubscriptionPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const editSubscriptionPlanForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

const subPlanUpdateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'billingInterval' },
  { name: 'billingIntervalCount', transform: 'int', falsyValue: 1 },
  { name: 'price', transform: 'cents', as: 'priceCents' },
  { name: 'compareAtPrice', transform: 'cents', as: 'compareAtPriceCents', falsyValue: undefined },
  { name: 'currency' },
  { name: 'setupFee', transform: 'cents', as: 'setupFeeCents', falsyValue: 0 },
  { name: 'trialDays', transform: 'int', falsyValue: undefined },
  { name: 'contractLength', transform: 'int', falsyValue: undefined },
  { name: 'isContractRequired', transform: 'boolTrue' },
  { name: 'discountPercent', transform: 'float', falsyValue: 0 },
  { name: 'discountAmount', transform: 'cents', as: 'discountAmountCents', falsyValue: 0 },
  { name: 'freeShippingThreshold', transform: 'cents', as: 'freeShippingThresholdCents', falsyValue: undefined },
  { name: 'includesFreeShipping', transform: 'boolTrue' },
  { name: 'includedProducts', transform: 'json', falsyValue: undefined },
  { name: 'features', transform: 'json', falsyValue: undefined },
  { name: 'sortOrder', transform: 'int', falsyValue: 0 },
  { name: 'isPopular', transform: 'boolTrue' },
  { name: 'isActive', transform: 'boolNotFalse' },
];

function parseSubscriptionPlanUpdates(body: HttpRequestBody): Record<string, unknown> {
  return buildFormObject(body as Record<string, unknown>, subPlanUpdateFields);
}

export const updateSubscriptionPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { planId } = req.params;
  const updates = parseSubscriptionPlanUpdates(req.body as HttpRequestBody);

  await manageSubscriptionsUseCase.saveSubscriptionPlan({
    subscriptionPlanId: planId,
    ...updates,
  });

  res.redirect(`/hub/subscription/plans/${planId}?success=Subscription plan updated successfully`);
};

export const deleteSubscriptionPlan = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { planId } = req.params;

  await manageSubscriptionsUseCase.deleteSubscriptionPlan(planId);

  res.json({ success: true, message: 'Subscription plan deleted successfully' });
};

// ============================================================================
// Customer Subscriptions Management
// ============================================================================

export const listCustomerSubscriptions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const viewCustomerSubscription = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const updateSubscriptionStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as HttpRequestBody;
  const { status } = body as { status: 'pending' | 'trialing' | 'active' | 'paused' | 'past_due' | 'cancelled' | 'expired' };

  await manageSubscriptionsUseCase.updateSubscriptionStatus(subscriptionId, status);

  res.json({ success: true, message: `Subscription status updated to ${status}` });
};

export const cancelCustomerSubscription = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as HttpRequestBody;
  const { reason, cancelAtPeriodEnd } = body as { reason?: string; cancelAtPeriodEnd?: string };

  await manageSubscriptionsUseCase.cancelSubscription(subscriptionId, reason, 'admin', cancelAtPeriodEnd === 'true');

  res.json({ success: true, message: 'Subscription cancelled successfully' });
};

// ============================================================================
// Billing Management
// ============================================================================

export const subscriptionBilling = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const processSubscriptionBilling = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as HttpRequestBody;
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
    subtotalCents: subscription.unitPriceCents * subscription.quantity,
    discountAmountCents: subscription.discountAmountCents,
    taxAmountCents: 0, // Would calculate based on tax rules
    shippingAmountCents: 0, // Would calculate based on shipping rules
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

export const manageFailedPayments = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { subscriptionId } = req.params;
  const body = req.body as HttpRequestBody;
  const { action, retryDate } = body as { action: string; retryDate?: string };

  if (action === 'retry') {
    // Create dunning attempt
    const subscription = await manageSubscriptionsUseCase.getCustomerSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await manageSubscriptionsUseCase.createDunningAttempt({
      customerSubscriptionId: subscriptionId,
      attemptNumber: subscription.failedPaymentCount + 1,
      amountCents: subscription.totalPriceCents,
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
