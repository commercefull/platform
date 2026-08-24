/**
 * Storefront Subscription Controller
 * Customer-facing subscription management pages
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { ManageStorefrontSubscriptionsUseCase } from '../../../modules/subscription/application/useCases/ManageStorefrontSubscriptions';

const manageStorefrontSubscriptionsUseCase = new ManageStorefrontSubscriptionsUseCase();

/**
 * GET: List available subscription plans
 */
export const listPlans = async (req: TypedRequest, res: Response) => {
  const plans = await manageStorefrontSubscriptionsUseCase.findActivePlansWithProduct();

  storefrontRespond(req, res, 'subscriptions/plans', {
    pageName: 'Subscription Plans',
    plans,
  });
  
};

/**
 * GET: View my subscriptions
 */
export const mySubscriptions = async (req: TypedRequest, res: Response) => {
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
export const viewSubscription = async (req: TypedRequest, res: Response) => {
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
export const cancelSubscription = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { subscriptionId } = req.params;
    const body = req.body as RequestBody;
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
