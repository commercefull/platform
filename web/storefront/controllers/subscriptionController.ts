/**
 * Storefront Subscription Controller
 * Customer-facing subscription management pages
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import * as storefrontSubscriptionRepo from '../../../modules/subscription/infrastructure/repositories/storefrontSubscriptionRepo';

/**
 * GET: List available subscription plans
 */
export const listPlans = async (req: TypedRequest, res: Response) => {
  try {
    const plans = await storefrontSubscriptionRepo.findActivePlansWithProduct();

    storefrontRespond(req, res, 'subscriptions/plans', {
      pageName: 'Subscription Plans',
      plans,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load subscription plans' });
  }
};

/**
 * GET: View my subscriptions
 */
export const mySubscriptions = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const subscriptions = await storefrontSubscriptionRepo.findByCustomerIdWithPlan(customerId);

    storefrontRespond(req, res, 'subscriptions/my-subscriptions', {
      pageName: 'My Subscriptions',
      subscriptions,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load subscriptions' });
  }
};

/**
 * GET: View subscription detail
 */
export const viewSubscription = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { subscriptionId } = req.params;

    const subscription = await storefrontSubscriptionRepo.findByIdWithPlan(subscriptionId, customerId);

    if (!subscription) {
      req.flash?.('error', 'Subscription not found');
      return res.redirect('/subscriptions');
    }

    const billingHistory = await storefrontSubscriptionRepo.findBillingHistory(subscriptionId);

    storefrontRespond(req, res, 'subscriptions/view', {
      pageName: 'Subscription Details',
      subscription,
      billingHistory,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load subscription' });
  }
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

    const subscription = await storefrontSubscriptionRepo.findActiveByCustomerId(subscriptionId, customerId);

    if (!subscription) {
      req.flash?.('error', 'Subscription not found or already cancelled');
      return res.redirect('/subscriptions');
    }

    await storefrontSubscriptionRepo.cancelSubscription(subscriptionId, (reason as string) || '');

    req.flash?.('success', 'Subscription cancelled successfully');
    res.redirect('/subscriptions');
  } catch (error) {
    logger.error('Error:', error);
    req.flash?.('error', 'Failed to cancel subscription');
    res.redirect('/subscriptions');
  }
};
