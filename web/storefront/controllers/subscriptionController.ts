/**
 * Storefront Subscription Controller
 * Customer-facing subscription management pages
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: List available subscription plans
 */
export const listPlans = async (req: TypedRequest, res: Response) => {
  try {
    const plans = await query(
      `SELECT sp.*, sprod."name" as "productName", sprod."description" as "productDescription"
       FROM "subscriptionPlan" sp
       LEFT JOIN "subscriptionProduct" sprod ON sp."subscriptionProductId" = sprod."subscriptionProductId"
       WHERE sp."isActive" = true
       ORDER BY sp."sortOrder", sp."price" ASC`,
      [],
    );

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

    const subscriptions = await query(
      `SELECT cs.*, sp."name" as "planName", sp."billingInterval", sp."price", sp."currency"
       FROM "customerSubscription" cs
       LEFT JOIN "subscriptionPlan" sp ON cs."subscriptionPlanId" = sp."subscriptionPlanId"
       WHERE cs."customerId" = $1
       ORDER BY cs."createdAt" DESC`,
      [customerId],
    );

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

    const subscription = await queryOne(
      `SELECT cs.*, sp."name" as "planName", sp."billingInterval", sp."price", sp."currency",
              sp."features", sp."description" as "planDescription"
       FROM "customerSubscription" cs
       LEFT JOIN "subscriptionPlan" sp ON cs."subscriptionPlanId" = sp."subscriptionPlanId"
       WHERE cs."customerSubscriptionId" = $1 AND cs."customerId" = $2`,
      [subscriptionId, customerId],
    );

    if (!subscription) {
      (req as any).flash?.('error', 'Subscription not found');
      return res.redirect('/subscriptions');
    }

    // Get billing history
    const billingHistory = await query(
      `SELECT * FROM "subscriptionBilling"
       WHERE "customerSubscriptionId" = $1
       ORDER BY "billingDate" DESC LIMIT 12`,
      [subscriptionId],
    );

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
    const { reason } = req.body;

    const subscription = await queryOne(
      `SELECT * FROM "customerSubscription"
       WHERE "customerSubscriptionId" = $1 AND "customerId" = $2 AND "status" = 'active'`,
      [subscriptionId, customerId],
    );

    if (!subscription) {
      (req as any).flash?.('error', 'Subscription not found or already cancelled');
      return res.redirect('/subscriptions');
    }

    await query(
      `UPDATE "customerSubscription"
       SET "status" = 'cancelled', "cancelledAt" = NOW(), "cancellationReason" = $1, "updatedAt" = NOW()
       WHERE "customerSubscriptionId" = $2`,
      [reason || '', subscriptionId],
    );

    (req as any).flash?.('success', 'Subscription cancelled successfully');
    res.redirect('/subscriptions');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to cancel subscription');
    res.redirect('/subscriptions');
  }
};
