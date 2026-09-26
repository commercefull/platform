/**
 * Subscription Business Controller
 * Handles admin/merchant subscription operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import {
  SubscriptionPlan,
  SubscriptionProduct,
  SubscriptionStatus,
  manageAdminSubscriptionsUseCase,
  processBillingCycleUseCase,
} from '../../application/wired';

const adminSubscriptions = manageAdminSubscriptionsUseCase;
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

// ============================================================================
// Subscription Products
// ============================================================================

export const getSubscriptionProducts: AsyncHandler = async (req, res, _next) => {
  const { activeOnly } = req.query;
  const products = await adminSubscriptions.getSubscriptionProducts(activeOnly !== 'false');
  res.json({ success: true, data: products });
};

export const getSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  const product = await adminSubscriptions.getSubscriptionProduct(req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Subscription product not found' });
    return;
  }

  const plans = await adminSubscriptions.getSubscriptionPlans(req.params.id);
  res.json({ success: true, data: { ...product, plans } });
};

export const createSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<SubscriptionProduct> & { productId: string };
  const product = await adminSubscriptions.saveSubscriptionProduct(body);
  res.status(201).json({ success: true, data: product });
};

export const updateSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<SubscriptionProduct>;
  const product = await adminSubscriptions.saveSubscriptionProduct({
    subscriptionProductId: req.params.id,
    ...body,
  } as Partial<SubscriptionProduct> & { productId: string });
  res.json({ success: true, data: product });
};

export const deleteSubscriptionProduct: AsyncHandler = async (req, res, _next) => {
  const product = await adminSubscriptions.getSubscriptionProduct(req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Subscription product not found' });
    return;
  }
  await adminSubscriptions.deleteSubscriptionProduct(req.params.id);
  res.json({ success: true, message: 'Subscription product deactivated' });
};

// ============================================================================
// Subscription Plans
// ============================================================================

export const getSubscriptionPlans: AsyncHandler = async (req, res, _next) => {
  const { activeOnly } = req.query;
  const plans = await adminSubscriptions.getSubscriptionPlans(req.params.productId, activeOnly !== 'false');
  res.json({ success: true, data: plans });
};

export const getSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  const plan = await adminSubscriptions.getSubscriptionPlan(req.params.planId);
  if (!plan) {
    res.status(404).json({ success: false, message: 'Subscription plan not found' });
    return;
  }
  res.json({ success: true, data: plan });
};

export const createSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<SubscriptionPlan> & { name: string; priceCents: number };
  const plan = await adminSubscriptions.saveSubscriptionPlan({
    subscriptionProductId: req.params.productId,
    ...body,
  });
  res.status(201).json({ success: true, data: plan });
};

export const updateSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<SubscriptionPlan> & { name: string; priceCents: number };
  const plan = await adminSubscriptions.saveSubscriptionPlan({
    subscriptionPlanId: req.params.planId,
    subscriptionProductId: req.params.productId,
    ...body,
  });
  res.json({ success: true, data: plan });
};

export const deleteSubscriptionPlan: AsyncHandler = async (req, res, _next) => {
  await adminSubscriptions.deleteSubscriptionPlan(req.params.planId);
  res.json({ success: true, message: 'Subscription plan deactivated' });
};

// ============================================================================
// Customer Subscriptions (Admin View)
// ============================================================================

export const getCustomerSubscriptions: AsyncHandler = async (req, res, _next) => {
  const { customerId, status, limit, offset } = req.query;
  const result = await adminSubscriptions.getCustomerSubscriptions(
    { customerId: customerId as string, status: status as SubscriptionStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const getCustomerSubscription: AsyncHandler = async (req, res, _next) => {
  const subscription = await adminSubscriptions.getCustomerSubscription(req.params.id);
  if (!subscription) {
    res.status(404).json({ success: false, message: 'Subscription not found' });
    return;
  }

  const orders = await adminSubscriptions.getSubscriptionOrders(req.params.id);
  const dunningAttempts = await adminSubscriptions.getDunningAttempts(req.params.id);

  res.json({ success: true, data: { ...subscription, orders, dunningAttempts } });
};

export const cancelSubscriptionAdmin: AsyncHandler = async (req, res, _next) => {
  const { reason, cancelAtPeriodEnd } = req.body as { reason?: string; cancelAtPeriodEnd?: boolean };
  const adminId = req.user?.userId || req.user?.organizationId;

  const existing = await adminSubscriptions.getCustomerSubscription(req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Subscription not found' });
    return;
  }

  await adminSubscriptions.cancelSubscription(req.params.id, reason, `admin:${adminId}`, cancelAtPeriodEnd !== false);

  res.json({ success: true, message: 'Subscription cancelled' });
};

export const pauseSubscriptionAdmin: AsyncHandler = async (req, res, _next) => {
  const { resumeAt, reason } = req.body as { resumeAt?: string; reason?: string };
  const adminId = req.user?.userId || req.user?.organizationId;

  const pause = await adminSubscriptions.pauseSubscription(req.params.id, resumeAt ? new Date(resumeAt) : undefined, reason, `admin:${adminId}`);

  res.json({ success: true, data: pause });
};

export const resumeSubscriptionAdmin: AsyncHandler = async (req, res, _next) => {
  const adminId = req.user?.userId || req.user?.organizationId;
  await adminSubscriptions.resumeSubscription(req.params.id, `admin:${adminId}`);
  res.json({ success: true, message: 'Subscription resumed' });
};

export const updateSubscriptionStatus: AsyncHandler = async (req, res, _next) => {
  const { status } = req.body as { status: SubscriptionStatus };
  await adminSubscriptions.updateSubscriptionStatus(req.params.id, status);
  res.json({ success: true, message: 'Subscription status updated' });
};

// ============================================================================
// Subscription Orders (Admin View)
// ============================================================================

export const getSubscriptionOrders: AsyncHandler = async (req, res, _next) => {
  const orders = await adminSubscriptions.getSubscriptionOrders(req.params.subscriptionId);
  res.json({ success: true, data: orders });
};

export const retrySubscriptionOrder: AsyncHandler = async (req, res, _next) => {
  // Mark order for retry
  await adminSubscriptions.updateSubscriptionOrderStatus(req.params.orderId, 'pending');
  res.json({ success: true, message: 'Order marked for retry' });
};

export const skipSubscriptionOrder: AsyncHandler = async (req, res, _next) => {
  await adminSubscriptions.updateSubscriptionOrderStatus(req.params.orderId, 'skipped');
  res.json({ success: true, message: 'Order skipped' });
};

// ============================================================================
// Dunning Management
// ============================================================================

export const getDunningAttempts: AsyncHandler = async (req, res, _next) => {
  const attempts = await adminSubscriptions.getDunningAttempts(req.params.subscriptionId);
  res.json({ success: true, data: attempts });
};

export const getPendingDunning: AsyncHandler = async (req, res, _next) => {
  const attempts = await adminSubscriptions.getPendingDunningAttempts(new Date());
  res.json({ success: true, data: attempts });
};

// ============================================================================
// Billing Operations
// ============================================================================

export const getSubscriptionsDueBilling: AsyncHandler = async (req, res, _next) => {
  const { beforeDate } = req.query;
  const date = beforeDate ? new Date(beforeDate as string) : new Date();
  const subscriptions = await adminSubscriptions.getSubscriptionsDueBilling(date);
  res.json({ success: true, data: subscriptions });
};

export const processBillingCycle: AsyncHandler = async (req, res, _next) => {
  try {
    const order = await processBillingCycleUseCase.execute(req.params.id);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};
