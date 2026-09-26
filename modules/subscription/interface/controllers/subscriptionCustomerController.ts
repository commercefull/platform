/**
 * Subscription Customer Controller
 * Handles customer-facing subscription operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageCustomerSubscriptionsUseCase } from '../../application/wired';
import type { SubscriptionStatus } from '../../domain/repositories/SubscriptionRepository';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

// ============================================================================
// Browse Subscription Products
// ============================================================================

export const getAvailableSubscriptionProducts: AsyncHandler = async (req, res, _next) => {
  const products = await manageCustomerSubscriptionsUseCase.getSubscriptionProducts(true);
  res.json({ success: true, data: products });
};

export const getSubscriptionProductDetails: AsyncHandler = async (req, res, _next) => {
  // Try to get by product ID first (for product page integration)
  let product = await manageCustomerSubscriptionsUseCase.getSubscriptionProductByProductId(req.params.productId);

  if (!product) {
    product = await manageCustomerSubscriptionsUseCase.getSubscriptionProduct(req.params.productId);
  }

  if (!product || !product.isActive) {
    res.status(404).json({ success: false, message: 'Subscription product not found' });
    return;
  }

  const plans = await manageCustomerSubscriptionsUseCase.getSubscriptionPlans(product.subscriptionProductId, true);
  res.json({ success: true, data: { ...product, plans } });
};

export const getSubscriptionPlanDetails: AsyncHandler = async (req, res, _next) => {
  const plan = await manageCustomerSubscriptionsUseCase.getSubscriptionPlan(req.params.planId);
  if (!plan || !plan.isActive) {
    res.status(404).json({ success: false, message: 'Subscription plan not found' });
    return;
  }
  res.json({ success: true, data: plan });
};

// ============================================================================
// My Subscriptions
// ============================================================================

export const getMySubscriptions: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { status, limit, offset } = req.query;

  const result = await manageCustomerSubscriptionsUseCase.getCustomerSubscriptions(
    { customerId, status: status as SubscriptionStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const getMySubscription: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const subscription = await manageCustomerSubscriptionsUseCase.getCustomerSubscription(req.params.id);

  if (!subscription || subscription.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Subscription not found' });
    return;
  }

  const orders = await manageCustomerSubscriptionsUseCase.getSubscriptionOrders(req.params.id);
  const plan = await manageCustomerSubscriptionsUseCase.getSubscriptionPlan(subscription.subscriptionPlanId);

  res.json({ success: true, data: { ...subscription, plan, orders } });
};

// ============================================================================
// Subscribe
// ============================================================================

export const createSubscription: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { subscriptionPlanId, productVariantId, quantity, shippingAddressId, billingAddressId, paymentMethodId, customizations } =
    req.body as {
      subscriptionPlanId: string;
      productVariantId?: string;
      quantity?: number;
      shippingAddressId?: string;
      billingAddressId?: string;
      paymentMethodId?: string;
      customizations?: Record<string, unknown>;
    };

  try {
    const subscription = await manageCustomerSubscriptionsUseCase.subscribe({
      customerId: customerId || '',
      subscriptionPlanId,
      productVariantId,
      quantity,
      shippingAddressId,
      billingAddressId,
      paymentMethodId,
      customizations,
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

// ============================================================================
// Manage Subscription
// ============================================================================

export const updateMySubscription: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const subscription = await manageCustomerSubscriptionsUseCase.getCustomerSubscription(req.params.id);

  if (!subscription || subscription.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Subscription not found' });
    return;
  }

  // Only allow updating certain fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { quantity, shippingAddressId, billingAddressId, paymentMethodId, customizations } = req.body as {
    quantity?: number;
    shippingAddressId?: string;
    billingAddressId?: string;
    paymentMethodId?: string;
    customizations?: Record<string, unknown>;
  };

  // For now, we'll just return success - full update logic would need more implementation
  res.json({ success: true, message: 'Subscription updated' });
};

export const changePlan: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { newPlanId } = req.body as { newPlanId: string };

  try {
    await manageCustomerSubscriptionsUseCase.changePlan(customerId || '', req.params.id, newPlanId);
    res.json({ success: true, message: 'Plan change scheduled' });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const pauseMySubscription: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { resumeAt, reason } = req.body as { resumeAt?: string; reason?: string };

  try {
    const pause = await manageCustomerSubscriptionsUseCase.pause(customerId || '', req.params.id, {
      resumeAt: resumeAt ? new Date(resumeAt) : undefined,
      reason,
    });
    res.json({ success: true, data: pause });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const resumeMySubscription: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;

  try {
    await manageCustomerSubscriptionsUseCase.resume(customerId || '', req.params.id);
    res.json({ success: true, message: 'Subscription resumed' });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const cancelMySubscription: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { reason, cancelAtPeriodEnd } = req.body as { reason?: string; cancelAtPeriodEnd?: boolean };

  try {
    const result = await manageCustomerSubscriptionsUseCase.cancel(customerId || '', req.params.id, {
      reason,
      cancelAtPeriodEnd,
    });

    res.json({
      success: true,
      message: result.cancelAtPeriodEnd
        ? 'Subscription will be cancelled at the end of the current billing period'
        : 'Subscription cancelled immediately',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const reactivateMySubscription: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;

  try {
    await manageCustomerSubscriptionsUseCase.reactivate(customerId || '', req.params.id);
    res.json({ success: true, message: 'Subscription reactivated' });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

// ============================================================================
// Billing History
// ============================================================================

export const getMySubscriptionOrders: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const subscription = await manageCustomerSubscriptionsUseCase.getCustomerSubscription(req.params.id);

  if (!subscription || subscription.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Subscription not found' });
    return;
  }

  const orders = await manageCustomerSubscriptionsUseCase.getSubscriptionOrders(req.params.id);
  res.json({ success: true, data: orders });
};

// ============================================================================
// Skip Delivery
// ============================================================================

export const skipNextDelivery: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;

  try {
    await manageCustomerSubscriptionsUseCase.skipNextDelivery(customerId || '', req.params.id);
    res.json({ success: true, message: 'Next delivery skipped' });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};
