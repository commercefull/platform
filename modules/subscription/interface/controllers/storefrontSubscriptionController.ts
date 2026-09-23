/**
 * Storefront Subscription Controller
 * Customer-facing subscription management pages
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { manageStorefrontSubscriptionsUseCase } from '../../application/wired';

/**
 * GET: List available subscription plans
 */
export const listPlans = async (req: HttpRequest, res: HttpResponse) => {
  const plans = await manageStorefrontSubscriptionsUseCase.findActivePlansWithProduct();

  storefrontRespond(req, res, 'subscriptions/plans', {
    pageName: 'Subscription Plans',
    plans,
  });
};

/**
 * GET: View my subscriptions
 */
export const mySubscriptions = async (req: HttpRequest, res: HttpResponse) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  const subscriptions = await manageStorefrontSubscriptionsUseCase.findByCustomerIdWithPlan(customerId);

  storefrontRespond(req, res, 'subscriptions/my-subscriptions', {
    pageName: 'My Subscriptions',
    subscriptions,
  });
};

/**
 * GET: View subscription detail
 */
export const viewSubscription = async (req: HttpRequest, res: HttpResponse) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  const { subscriptionId } = req.params;

  const subscription = await manageStorefrontSubscriptionsUseCase.findByIdWithPlan(subscriptionId, customerId);

  if (!subscription) {
    req.flash?.('error', 'Subscription not found');
    return res.redirect('/subscriptions');
  }

  const billingHistory = await manageStorefrontSubscriptionsUseCase.findBillingHistory(subscriptionId);

  storefrontRespond(req, res, 'subscriptions/view', {
    pageName: 'Subscription Details',
    subscription,
    billingHistory,
  });
};

/**
 * POST: Cancel subscription
 */
export const cancelSubscription = async (req: HttpRequest, res: HttpResponse) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { subscriptionId } = req.params;
    const body = req.body as HttpRequestBody;
    const { reason } = body;

    const subscription = await manageStorefrontSubscriptionsUseCase.findActiveByCustomerId(subscriptionId, customerId);

    if (!subscription) {
      req.flash?.('error', 'Subscription not found or already cancelled');
      return res.redirect('/subscriptions');
    }

    await manageStorefrontSubscriptionsUseCase.cancelSubscription(subscriptionId, (reason as string) || '');

    req.flash?.('success', 'Subscription cancelled successfully');
    res.redirect('/subscriptions');
  } catch (error) {
    logger.warn('Error:', error);
    req.flash?.('error', 'Failed to cancel subscription');
    res.redirect('/subscriptions');
  }
};
